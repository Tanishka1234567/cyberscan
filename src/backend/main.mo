import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Int "mo:core/Int";
import Nat "mo:core/Nat";

import OutCall "mo:caffeineai-http-outcalls/outcall";



actor {
  type ScanType = {
    #url;
    #dns;
    #ip;
  };

  type AiAnalysisResult = {
    confidence : Float;
    riskLevel : Text;   // "Low" | "Medium" | "High" | "Critical"
    verdict : Text;     // "Safe" | "Suspicious" | "Malicious"
    explanation : Text;
    available : Bool;
  };

  type ResultSummary = {
    verdict : Text;
    threatsFound : [Text];
    riskScore : Nat;
    resolverName : Text;
    recordType : Text;
    recordValue : Text;
  };

  type ScanHistoryEntry = {
    target : Text;
    scanType : ScanType;
    timestamp : Time.Time;
    summary : ResultSummary;
    aiAnalysis : ?AiAnalysisResult;
  };

  module ScanHistoryEntry {
    public func compare(e1 : ScanHistoryEntry, e2 : ScanHistoryEntry) : Order.Order {
      Int.compare(
        e2.timestamp : Int,
        e1.timestamp : Int,
      );
    };
  };

  type User = {
    email : Text;
    username : Text;
    password : Text;
    otp : ?Text;
    otpTimestamp : ?Time.Time;
  };

  type RegistrationResult = {
    #success : Text;
    #duplicateEmail;
    #duplicateUsername;
    #invalidEmailFormat;
    #invalidUsernameLength;
    #invalidPasswordLength;
  };

  type LoginResult = {
    #success : Text;
    #wrongPassword;
    #userNotFound;
  };

  type OtpGenerationResult = {
    #success : Text;
    #userNotFound;
    #internalError;
  };

  type PasswordResetResult = {
    #success : Text;
    #invalidOtp;
    #userNotFound;
    #otpExpired;
  };

  // API keys — default to empty string so callers skip the API when not configured
  var virusTotalApiKey : Text = "12f701007c025fbde5b64dc28401bc86fb4c7e93b4bf664f6ae94db0df159246";
  var safeBrowsingApiKey : Text = "";
  var whoisApiKey : Text = "";
  var abuseIpDbApiKey : Text = "6a367128debba6f25c7d0a817c089a47ad919c3ec694315b7a1266bc0279c5c0a5c345e2e51d7b68";
  var aiApiKey : Text = "";

  // Stable storage — persists across canister upgrades/redeploys
  var stableUsers : [(Text, User)] = [];
  var stableScanHistory : [ScanHistoryEntry] = [];
  var stableNextOtp : Int = 100_000;

  // Runtime Maps (rebuilt from stable on upgrade via postupgrade)
  let scanHistory = List.empty<ScanHistoryEntry>();
  let _userRequestCount = Map.empty<Principal, Nat>();
  let users = Map.empty<Text, User>();

  system func preupgrade() {
    stableUsers := users.entries().toArray();
    stableScanHistory := scanHistory.toArray();
    stableNextOtp := nextOtp;
  };

  system func postupgrade() {
    for ((email, user) in stableUsers.vals()) {
      users.add(email, user);
    };
    for (entry in stableScanHistory.vals()) {
      scanHistory.add(entry);
    };
    nextOtp := stableNextOtp;
  };

  public shared ({ caller = _ }) func setVirusTotalApiKey(newKey : Text) : async () {
    virusTotalApiKey := newKey;
  };

  public shared ({ caller = _ }) func setSafeBrowsingApiKey(newKey : Text) : async () {
    safeBrowsingApiKey := newKey;
  };

  public shared ({ caller = _ }) func setWhoisApiKey(newKey : Text) : async () {
    whoisApiKey := newKey;
  };

  public shared ({ caller = _ }) func setAbuseIpDbApiKey(newKey : Text) : async () {
    abuseIpDbApiKey := newKey;
  };

  public shared ({ caller = _ }) func setAiApiKey(apiKey : Text) : async Bool {
    aiApiKey := apiKey;
    true;
  };

  public type Header = OutCall.Header;

  public type TransformationInput = OutCall.TransformationInput;

  public type TransformationOutput = OutCall.TransformationOutput;

  public query func transform(input : TransformationInput) : async TransformationOutput {
    OutCall.transform(input);
  };

  func makeGetOutcall(url : Text, headers : [Header]) : async Text {
    await OutCall.httpGetRequest(url, headers, transform);
  };

  func makePostOutcall(url : Text, headers : [Header], body : Text) : async Text {
    await OutCall.httpPostRequest(url, headers, body, transform);
  };

  // Escape a raw string so it is safe to embed as a JSON string value.
  // Handles backslash, double-quote, newline, carriage-return, and tab.
  func jsonEscape(s : Text) : Text {
    var result = s;
    // Order matters: escape backslashes first to avoid double-escaping
    result := result.replace(#text "\\", "\\\\");
    result := result.replace(#text "\u{22}", "\\\u{22}");
    result := result.replace(#text "\n", "\\n");
    result := result.replace(#text "\r", "\\r");
    result := result.replace(#text "\t", "\\t");
    result;
  };

  // Wrap a raw API response as a JSON string value (quoted + escaped).
  // Use when the raw response is NOT guaranteed to be valid JSON itself.
  func toJsonString(s : Text) : Text {
    "\u{22}" # jsonEscape(s) # "\u{22}";
  };

  // Try to detect whether a text looks like a JSON object or array.
  // If so, embed it directly; otherwise wrap it as a JSON string.
  func embedJson(s : Text) : Text {
    let trimmed = s.trimStart(#text " ");
    let looksLikeJson = trimmed.startsWith(#text "{") or trimmed.startsWith(#text "[");
    if (looksLikeJson) {
      // Still escape nothing — just embed; if malformed it will be a string
      trimmed;
    } else {
      toJsonString(trimmed);
    };
  };

  // Build a safe JSON error object for when an API call is skipped or fails.
  func apiErrorJson(reason : Text) : Text {
    "{\"error\": " # toJsonString(reason) # "}";
  };

  // Calls Cloudmersive phishing detection API and returns an AiAnalysisResult.
  // On any failure sets available=false so callers can handle gracefully.
  func analyzeWithAIInternal(target : Text, scanType : Text) : async AiAnalysisResult {
    if (aiApiKey == "") {
      return {
        confidence = 0.0;
        riskLevel = "Unknown";
        verdict = "Unknown";
        explanation = "AI API key not configured.";
        available = false;
      };
    };

    let url = "https://api.cloudmersive.com/virus/scan/website";
    let headers : [Header] = [
      { name = "Apikey"; value = aiApiKey },
      { name = "Content-Type"; value = "application/x-www-form-urlencoded" },
    ];
    // Cloudmersive website scan endpoint expects the URL in the body
    let body = "Url=" # target;

    try {
      let response = await makePostOutcall(url, headers, body);

      // Parse key fields from the JSON response text.
      // CleanResult: true  → Safe
      // CleanResult: false → check WebsiteThreatType
      let isClean = response.contains(#text "\"CleanResult\":true");
      let isMalware = response.contains(#text "\"WebsiteThreatType\":\"Malware\"");
      let isPhishing = response.contains(#text "\"WebsiteThreatType\":\"Phishing\"");
      let isSpam = response.contains(#text "\"WebsiteThreatType\":\"Spam\"");
      let hasViruses = response.contains(#text "\"FoundViruses\":[{");

      if (isClean) {
        {
          confidence = 95.0;
          riskLevel = "Low";
          verdict = "Safe";
          explanation = "AI analysis found no phishing, malware, or spam indicators.";
          available = true;
        };
      } else if (isPhishing) {
        {
          confidence = 92.0;
          riskLevel = "Critical";
          verdict = "Malicious";
          explanation = "AI detected phishing content on this " # scanType # ". Avoid sharing credentials.";
          available = true;
        };
      } else if (isMalware or hasViruses) {
        {
          confidence = 90.0;
          riskLevel = "High";
          verdict = "Malicious";
          explanation = "AI detected malware or malicious code associated with this " # scanType # ".";
          available = true;
        };
      } else if (isSpam) {
        {
          confidence = 75.0;
          riskLevel = "Medium";
          verdict = "Suspicious";
          explanation = "AI flagged this " # scanType # " as spam or potentially unwanted content.";
          available = true;
        };
      } else {
        // CleanResult is false but no specific threat type identified
        {
          confidence = 60.0;
          riskLevel = "Medium";
          verdict = "Suspicious";
          explanation = "AI flagged this " # scanType # " as potentially unsafe. Proceed with caution.";
          available = true;
        };
      };
    } catch (_err) {
      {
        confidence = 0.0;
        riskLevel = "Unknown";
        verdict = "Unknown";
        explanation = "AI analysis unavailable due to an error or timeout.";
        available = false;
      };
    };
  };

  // Public wrapper kept for frontend compatibility
  public shared ({ caller = _ }) func analyzeWithAI(target : Text, scanType : Text) : async AiAnalysisResult {
    await analyzeWithAIInternal(target, scanType);
  };

  func addToHistory(entry : ScanHistoryEntry) {
    let historySize = scanHistory.size();
    if (historySize >= 20) {
      let entries = scanHistory.toArray().sliceToArray(1, historySize);
      scanHistory.clear();
      scanHistory.addAll(entries.values());
    };
    scanHistory.add(entry);
  };

  // Build aiAnalysis JSON fragment from an AiAnalysisResult record.
  func aiAnalysisJson(ai : AiAnalysisResult) : Text {
    "{" #
      "\"verdict\": " # toJsonString(ai.verdict) # ", " #
      "\"riskLevel\": " # toJsonString(ai.riskLevel) # ", " #
      "\"explanation\": " # toJsonString(ai.explanation) # ", " #
      "\"available\": " # (if (ai.available) "true" else "false") #
    "}";
  };

  // ── scanPhishing ────────────────────────────────────────────────────────────
  // Dedicated phishing detection for a URL.
  // Combines Google Safe Browsing (SOCIAL_ENGINEERING), VirusTotal phishing
  // engine flags, Cloudmersive AI, and local heuristic indicators.
  // Returns a JSON string matching the PhishingScanResult schema.
  public shared ({ caller = _ }) func scanPhishing(url : Text) : async Text {

    // ── 1. Local heuristic indicators ──────────────────────────────────────
    let urlLower = url.toLower();

    // Suspicious domain patterns
    let hasManyHyphens : Bool = do {
      var count = 0;
      for (c in urlLower.chars()) { if (c == '-') { count += 1 } };
      count >= 3;
    };

    let hasNumericIp : Bool = do {
      // Rough heuristic: after "://" check if next segment is all digits + dots
      var found = false;
      let afterProto : Text = if (urlLower.contains(#text "://")) {
        let parts = urlLower.split(#text "://");
        var second = "";
        var idx = 0;
        for (p in parts) {
          if (idx == 1) { second := p };
          idx += 1;
        };
        second;
      } else { urlLower };
      // Take the host portion (up to first / or end)
      var host = afterProto;
      let hostParts = afterProto.split(#text "/");
      var hidx = 0;
      for (h in hostParts) {
        if (hidx == 0) { host := h };
        hidx += 1;
      };
      // Check if host looks like x.x.x.x
      var allNumericDots = host.size() > 0;
      for (c in host.chars()) {
        if (not (c == '.' or (c >= '0' and c <= '9'))) {
          allNumericDots := false;
        };
      };
      found := allNumericDots and host.contains(#text ".");
      found;
    };

    let hasLongSubdomains : Bool = do {
      // More than 3 dots suggests deep subdomain chain
      var dotCount = 0;
      for (c in urlLower.chars()) { if (c == '.') { dotCount += 1 } };
      dotCount >= 4;
    };

    let isHttp : Bool = urlLower.startsWith(#text "http://") and
                        not urlLower.startsWith(#text "https://");

    let brandKeywords : [Text] = [
      "paypal", "amazon", "bank", "google", "microsoft", "apple",
      "login", "secure", "account", "verify", "update", "confirm",
      "signin", "credential", "password", "wallet", "crypto",
    ];
    let hasBrandKeyword : Bool = do {
      var found = false;
      for (kw in brandKeywords.vals()) {
        if (urlLower.contains(#text kw)) { found := true };
      };
      found;
    };

    // Collect indicators as {name, detected} pairs for the JSON response
    let indicatorNames : [Text] = [
      "Suspicious hyphens in domain",
      "Numeric IP address instead of domain",
      "Long subdomain chain",
      "Insecure HTTP (not HTTPS)",
      "Brand impersonation keyword detected",
    ];
    let indicatorDetected : [Bool] = [
      hasManyHyphens, hasNumericIp, hasLongSubdomains, isHttp, hasBrandKeyword,
    ];

    var indicatorCount = 0;
    for (d in indicatorDetected.vals()) {
      if (d) { indicatorCount += 1 };
    };

    // Build indicators JSON array
    var indicatorsJson = "[";
    var iIdx = 0;
    while (iIdx < 5) {
      if (iIdx > 0) { indicatorsJson #= "," };
      indicatorsJson #= "{\"name\":" # toJsonString(indicatorNames[iIdx]) #
                        ",\"detected\":" # (if (indicatorDetected[iIdx]) "true" else "false") # "}";
      iIdx += 1;
    };
    indicatorsJson #= "]";

    // ── 2. Google Safe Browsing (SOCIAL_ENGINEERING only) ──────────────────
    let sbPhishingDetected : Bool = if (safeBrowsingApiKey == "") { false } else {
      try {
        let sbUrl = "https://safebrowsing.googleapis.com/v4/threatMatches:find?key=" # safeBrowsingApiKey;
        let sbPayload =
          "{" #
            "\"client\": {\"clientId\": \"ic_cybersec_app\", \"clientVersion\": \"1.0.0\"}," #
            "\"threatInfo\": {" #
              "\"threatTypes\": [\"SOCIAL_ENGINEERING\"]," #
              "\"platformTypes\": [\"ANY_PLATFORM\"]," #
              "\"threatEntryTypes\": [\"URL\"]," #
              "\"threatEntries\": [{\"url\": " # toJsonString(url) # "}]" #
            "}" #
          "}";
        let sbHeaders : [Header] = [];
        let raw = await makePostOutcall(sbUrl, sbHeaders, sbPayload);
        // A non-empty matches array means phishing detected
        raw.contains(#text "\"matches\"") and not raw.contains(#text "\"matches\":[]") and not raw.contains(#text "\"matches\": []");
      } catch (_) { false };
    };

    // Collect threat types found by Safe Browsing (simplified: just SOCIAL_ENGINEERING if detected)
    let _sbThreatTypes : [Text] = if (sbPhishingDetected) { ["SOCIAL_ENGINEERING"] } else { [] };

    let sbAvailable = safeBrowsingApiKey != "";
    let sbJson = "{" #
      "\"phishingDetected\":" # (if (sbPhishingDetected) "true" else "false") # "," #
      "\"available\":" # (if (sbAvailable) "true" else "false") # "," #
      "\"threatTypes\":[" # (if (sbPhishingDetected) "\"SOCIAL_ENGINEERING\"" else "") # "]" #
      "}";

    // ── 3. VirusTotal phishing engine count ────────────────────────────────
    // We POST to the URL scan endpoint; the response includes categories from engines.
    // We look for "phishing" in engine category values.
    var vtPhishingDetected = false;
    var vtEngineCount = 0; // engines that flagged phishing
    var vtTotalEngines = 0;

    if (virusTotalApiKey != "") {
      try {
        let vtUrl = "https://www.virustotal.com/api/v3/urls/scan";
        let vtHeaders = [{ name = "x-apikey"; value = virusTotalApiKey }];
        let postBody = "{\"url\": " # toJsonString(url) # "}";
        let raw = await makePostOutcall(vtUrl, vtHeaders, postBody);

        // Count occurrences of "phishing" in the response
        var searchIn = raw.toLower();
        var phishCount = 0;
        let marker = "phishing";
        while (searchIn.contains(#text marker)) {
          phishCount += 1;
          // advance past this occurrence by splitting once and taking the tail
          let parts = searchIn.split(#text marker);
          var rebuilt = "";
          var pIdx = 0;
          for (p in parts) {
            if (pIdx > 0) {
              rebuilt #= if (pIdx == 1) "XXXXX" else marker # p;
            } else {
              rebuilt #= p;
            };
            pIdx += 1;
          };
          searchIn := rebuilt;
        };
        vtEngineCount := phishCount;
        vtPhishingDetected := phishCount > 0;
        // Rough estimate: VirusTotal typically queries ~70 engines
        vtTotalEngines := 70;
      } catch (_) {};
    };

    let vtJson = "{" #
      "\"detected\":" # (if (vtPhishingDetected) "true" else "false") # "," #
      "\"engineCount\":" # vtEngineCount.toText() # "," #
      "\"totalEngines\":" # vtTotalEngines.toText() # "," #
      "\"available\":" # (if (virusTotalApiKey != "") "true" else "false") #
      "}";

    // ── 4. Cloudmersive AI ─────────────────────────────────────────────────
    let aiResult = await analyzeWithAIInternal(url, "url");
    let aiPhishing = aiResult.available and (aiResult.verdict == "Malicious") and
                     (aiResult.explanation.contains(#text "phishing") or aiResult.riskLevel == "Critical");
    let aiSuspicious = aiResult.available and aiResult.verdict == "Suspicious";

    let aiJson = "{" #
      "\"available\":" # (if (aiResult.available) "true" else "false") # "," #
      "\"verdict\":" # toJsonString(aiResult.verdict) # "," #
      "\"riskLevel\":" # toJsonString(aiResult.riskLevel) # "," #
      "\"confidence\":" # debug_show(aiResult.confidence) # "," #
      "\"explanation\":" # toJsonString(aiResult.explanation) #
      "}";

    // ── 5. Composite verdict ───────────────────────────────────────────────
    // Phishing: Safe Browsing SOCIAL_ENGINEERING OR VirusTotal phishing engines > 2 OR Cloudmersive = Phishing
    // Suspicious: 1-2 VirusTotal engines OR Cloudmersive = Suspicious OR indicators >= 3
    // Safe: otherwise
    let verdict : Text = if (
      sbPhishingDetected or
      vtEngineCount > 2 or
      aiPhishing
    ) {
      "Phishing";
    } else if (
      (vtEngineCount >= 1 and vtEngineCount <= 2) or
      aiSuspicious or
      indicatorCount >= 3
    ) {
      "Suspicious";
    } else {
      "Safe";
    };

    let confidence : Nat = if (verdict == "Phishing") {
      if (sbPhishingDetected and vtEngineCount > 2) { 95 }
      else if (sbPhishingDetected) { 90 }
      else if (vtEngineCount > 2) { 88 }
      else { 85 };
    } else if (verdict == "Suspicious") {
      if (indicatorCount >= 3 and aiSuspicious) { 75 }
      else if (aiSuspicious) { 65 }
      else { 50 };
    } else {
      if (indicatorCount == 0) { 98 } else { 90 };
    };

    // ── 6. Save to scan history ────────────────────────────────────────────
    addToHistory({
      target = url;
      scanType = #url;
      timestamp = Time.now();
      summary = {
        verdict = verdict;
        threatsFound = if (verdict == "Phishing") { ["Phishing"] } else if (verdict == "Suspicious") { ["Suspicious"] } else { [] };
        riskScore = if (verdict == "Phishing") { 90 } else if (verdict == "Suspicious") { 50 } else { 5 };
        resolverName = "PhishingDetection";
        recordType = "URL";
        recordValue = url;
      };
      aiAnalysis = ?aiResult;
    });

    // ── 7. Return JSON ─────────────────────────────────────────────────────
    "{" #
      "\"verdict\":" # toJsonString(verdict) # "," #
      "\"confidence\":" # confidence.toText() # "," #
      "\"indicators\":" # indicatorsJson # "," #
      "\"safeBrowsing\":" # sbJson # "," #
      "\"virusTotalPhishing\":" # vtJson # "," #
      "\"aiAnalysis\":" # aiJson # "," #
      "\"url\":" # toJsonString(url) # "," #
      "\"scanTime\":" # Time.now().toText() #
    "}";
  };

  public shared ({ caller = _ }) func scanUrl(url : Text) : async Text {
    // --- VirusTotal ---
    let vtJson : Text = if (virusTotalApiKey == "") {
      apiErrorJson("VirusTotal API key not configured");
    } else {
      try {
        let vtUrl = "https://www.virustotal.com/api/v3/urls/scan";
        let vtHeaders = [{ name = "x-apikey"; value = virusTotalApiKey }];
        let postBody = "{\"url\": " # toJsonString(url) # "}";
        let raw = await makePostOutcall(vtUrl, vtHeaders, postBody);
        embedJson(raw);
      } catch (_err) {
        apiErrorJson("VirusTotal request failed");
      };
    };

    // --- Google Safe Browsing ---
    let sbJson : Text = if (safeBrowsingApiKey == "") {
      apiErrorJson("Safe Browsing API key not configured");
    } else {
      try {
        let sbUrl = "https://safebrowsing.googleapis.com/v4/threatMatches:find?key=" # safeBrowsingApiKey;
        let sbPayload =
          "{" #
            "\"client\": {\"clientId\": \"ic_cybersec_app\", \"clientVersion\": \"1.0.0\"}," #
            "\"threatInfo\": {" #
              "\"threatTypes\": [\"MALWARE\", \"SOCIAL_ENGINEERING\"]," #
              "\"platformTypes\": [\"ANY_PLATFORM\"]," #
              "\"threatEntryTypes\": [\"URL\"]," #
              "\"threatEntries\": [{\"url\": " # toJsonString(url) # "}]" #
            "}" #
          "}";
        let sbHeaders : [Header] = [];
        let raw = await makePostOutcall(sbUrl, sbHeaders, sbPayload);
        embedJson(raw);
      } catch (_err) {
        apiErrorJson("Safe Browsing request failed");
      };
    };

    // --- AI analysis ---
    let aiResult = await analyzeWithAIInternal(url, "url");

    let resultSummary = {
      verdict = "SAFE";
      threatsFound = [];
      riskScore = 10;
      resolverName = "";
      recordType = "";
      recordValue = "";
    };

    addToHistory({
      target = url;
      scanType = #url;
      timestamp = Time.now();
      summary = resultSummary;
      aiAnalysis = ?aiResult;
    });

    // Return a single valid JSON object with all response segments
    "{" #
      "\"vtResponse\": " # vtJson # ", " #
      "\"sbResponse\": " # sbJson # ", " #
      "\"aiAnalysis\": " # aiAnalysisJson(aiResult) #
    "}";
  };

  public shared ({ caller = _ }) func lookupDns(domain : Text) : async Text {
    // --- DNS (Cloudflare DoH) ---
    // Returns pipe-separated "dnsJson | whoisJson" for frontend parsing.
    let dnsJson : Text = try {
      let dnsUrl = "https://cloudflare-dns.com/dns-query?name=" # domain # "&type=A";
      let dnsHeaders : [Header] = [{ name = "accept"; value = "application/dns-json" }];
      await makeGetOutcall(dnsUrl, dnsHeaders);
    } catch (_err) {
      apiErrorJson("DNS request failed");
    };

    // --- WHOIS ---
    let whoisJson : Text = if (whoisApiKey == "") {
      apiErrorJson("WHOIS API key not configured");
    } else {
      try {
        let whoisUrl = "https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey=" # whoisApiKey # "&domainName=" # domain # "&outputFormat=JSON";
        let whoisHeaders : [Header] = [];
        await makeGetOutcall(whoisUrl, whoisHeaders);
      } catch (_err) {
        apiErrorJson("WHOIS request failed");
      };
    };

    addToHistory({
      target = domain;
      scanType = #dns;
      timestamp = Time.now();
      summary = {
        verdict = "SAFE";
        threatsFound = [];
        riskScore = 5;
        resolverName = "Cloudflare";
        recordType = "A";
        recordValue = dnsJson;
      };
      aiAnalysis = null;
    });

    // Pipe-separated format — frontend splits on " | " to get [dnsJson, whoisJson]
    dnsJson # " | " # whoisJson;
  };

  public shared ({ caller = _ }) func scanIp(ip : Text) : async Text {
    // --- AbuseIPDB ---
    let abuseJson : Text = if (abuseIpDbApiKey == "") {
      apiErrorJson("AbuseIPDB API key not configured");
    } else {
      try {
        let abuseUrl = "https://api.abuseipdb.com/api/v2/check?ipAddress=" # ip # "&maxAgeInDays=90";
        let abuseHeaders : [Header] = [
          { name = "Key"; value = abuseIpDbApiKey },
          { name = "Accept"; value = "application/json" },
        ];
        let raw = await makeGetOutcall(abuseUrl, abuseHeaders);
        embedJson(raw);
      } catch (_err) {
        apiErrorJson("AbuseIPDB request failed");
      };
    };

    // --- ip-api.com geolocation (no API key required, free endpoint) ---
    // Provides accurate city/country/region for public IPs including 8.8.8.8
    let geoJson : Text = try {
      let geoUrl = "http://ip-api.com/json/" # ip # "?fields=status,country,regionName,city,lat,lon,isp,org,as,query";
      let geoHeaders : [Header] = [];
      let raw = await makeGetOutcall(geoUrl, geoHeaders);
      // Only embed if it looks like a successful JSON response
      let trimmed = raw.trimStart(#text " ");
      if (trimmed.startsWith(#text "{")) {
        // Check for success status — if not success, return a fallback object
        if (raw.contains(#text "\"status\":\"success\"")) {
          trimmed;
        } else {
          "{\"status\":\"fail\",\"country\":\"\",\"regionName\":\"\",\"city\":\"\",\"lat\":0,\"lon\":0,\"isp\":\"\",\"org\":\"\"}";
        };
      } else {
        "{\"status\":\"fail\",\"country\":\"\",\"regionName\":\"\",\"city\":\"\",\"lat\":0,\"lon\":0,\"isp\":\"\",\"org\":\"\"}";
      };
    } catch (_err) {
      "{\"status\":\"fail\",\"country\":\"\",\"regionName\":\"\",\"city\":\"\",\"lat\":0,\"lon\":0,\"isp\":\"\",\"org\":\"\"}";
    };

    // AI heuristic for IPs: wrap in a fake URL-like string and call the same endpoint
    let aiResult = await analyzeWithAIInternal("http://" # ip, "ip");

    addToHistory({
      target = ip;
      scanType = #ip;
      timestamp = Time.now();
      summary = {
        verdict = "CHECKED";
        threatsFound = [];
        riskScore = 0;
        resolverName = "AbuseIPDB";
        recordType = "IP";
        recordValue = ip;
      };
      aiAnalysis = ?aiResult;
    });

    // Return a single valid JSON object with all response segments
    // geoLocation comes from ip-api.com for accurate city/country/region
    "{" #
      "\"abuseResponse\": " # abuseJson # ", " #
      "\"geoLocation\": " # geoJson # ", " #
      "\"aiAnalysis\": " # aiAnalysisJson(aiResult) #
    "}";
  };

  public shared ({ caller = _ }) func getScanHistory() : async [ScanHistoryEntry] {
    scanHistory.toArray().sort();
  };

  public shared ({ caller = _ }) func getHistoryEntryByTarget(target : Text) : async ScanHistoryEntry {
    switch (scanHistory.find(func(entry) { entry.target == target })) {
      case (?entry) { entry };
      case (null) { Runtime.trap("History entry for target " # target # "\" not found!") };
    };
  };

  public query ({ caller = _ }) func ping() : async Text {
    "pong";
  };

  func checkRegistrationInput(email : Text, username : Text, password : Text) : RegistrationResult {
    if (not email.contains(#char '@')) {
      return #invalidEmailFormat;
    };
    if (username.size() < 3 or username.size() > 40) {
      return #invalidUsernameLength;
    };
    if (password.size() < 1 or password.size() > 40) {
      return #invalidPasswordLength;
    };
    #success("Registration input is valid");
  };

  public shared ({ caller = _ }) func createUser(email : Text, username : Text, password : Text) : async RegistrationResult {
    let validationResult = checkRegistrationInput(email, username, password);
    switch (validationResult) {
      case (#success(_)) {};
      case (#duplicateEmail or #duplicateUsername or #invalidEmailFormat or #invalidUsernameLength or #invalidPasswordLength) { return validationResult };
    };

    if (users.containsKey(email)) {
      return #duplicateEmail;
    };
    for ((_, user) in users.entries()) {
      if (user.username == username) {
        return #duplicateUsername;
      };
    };
    let newUser : User = {
      email;
      username;
      password;
      otp = null;
      otpTimestamp = null;
    };
    users.add(email, newUser);
    #success("User successfully registered! Email: " # email # ", Username: " # username);
  };

  public shared ({ caller = _ }) func authenticateUser(email : Text, password : Text) : async LoginResult {
    switch (users.get(email)) {
      case (?user) {
        if (user.password == password) {
          #success(user.username);
        } else {
          #wrongPassword;
        };
      };
      case (null) {
        #userNotFound;
      };
    };
  };

  public shared ({ caller = _ }) func requestPasswordReset(email : Text) : async OtpGenerationResult {
    let otp = generateOtp();
    let timestamp = Time.now();
    switch (users.get(email)) {
      case (?user) {
        let updatedUser = {
          email = user.email;
          username = user.username;
          password = user.password;
          otp = ?otp;
          otpTimestamp = ?timestamp;
        };
        users.add(email, updatedUser);
        #success(otp);
      };
      case (null) {
        #userNotFound;
      };
    };
  };

  public shared ({ caller = _ }) func verifyOtpAndResetPassword(email : Text, otp : Text, newPassword : Text) : async PasswordResetResult {
    let otpValidityDuration = 900_000_000_000;
    switch (users.get(email)) {
      case (?user) {
        switch (user.otp, user.otpTimestamp) {
          case (?storedOtp, ?otpTimestamp) {
            if (storedOtp == otp) {
              let currentTime = Time.now();
              if ((currentTime - otpTimestamp) < otpValidityDuration) {
                let updatedUser = {
                  email = user.email;
                  username = user.username;
                  password = newPassword;
                  otp = null;
                  otpTimestamp = null;
                };
                users.add(email, updatedUser);
                #success("Password reset successful!");
              } else {
                #otpExpired;
              };
            } else {
              #invalidOtp;
            };
          };
          case (_) {
            #invalidOtp;
          };
        };
      };
      case (null) {
        #userNotFound;
      };
    };
  };

  public shared ({ caller = _ }) func getUsernameByEmail(email : Text) : async Text {
    switch (users.get(email)) {
      case (?user) { user.username };
      case (null) { Runtime.trap("User not found!") };
    };
  };

  public query ({ caller = _ }) func allUsers() : async [User] {
    users.toArray().map(func(tuple) { tuple.1 });
  };

  var nextOtp : Int = 100_000;
  func generateOtp() : Text {
    nextOtp += 1;
    if (nextOtp > 999_999) {
      nextOtp := 100_000;
    };
    nextOtp.toText();
  };

  public query ({ caller }) func authenticateRequest() : async () {
    switch (caller.toText()) {
      case ("2vxsx-fae") {};
      case (_) { Runtime.trap("Authorization failed. Please authenticate.") };
    };
  };
};
