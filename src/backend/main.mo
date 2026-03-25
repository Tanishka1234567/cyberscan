import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Int "mo:core/Int";
import Blob "mo:core/Blob";

import OutCall "http-outcalls/outcall";

actor {
  type ScanType = {
    #url;
    #dns;
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
  };

  module ScanHistoryEntry {
    public func compare(e1 : ScanHistoryEntry, e2 : ScanHistoryEntry) : Order.Order {
      Int.compare(
        e2.timestamp : Int,
        e1.timestamp : Int,
      );
    };
  };

  type DnsRecord = {
    name : Text;
    recordType : Text;
    value : Text;
  };

  type WhoisInfo = {
    registrar : Text;
    registeredDate : Time.Time;
    expiryDate : Time.Time;
    isPrivacyMasked : Bool;
  };

  type HistoryFetchResult = {
    #ok : [ScanHistoryEntry];
    #empty;
  };

  var virusTotalApiKey : Text = "PLACEHOLDER_VT_API_KEY";
  var safeBrowsingApiKey : Text = "PLACEHOLDER_SB_API_KEY";
  var whoisApiKey : Text = "PLACEHOLDER_WHOIS_API_KEY";

  let scanHistory = List.empty<ScanHistoryEntry>();
  let userRequestCount = Map.empty<Principal, Nat>();

  public shared ({ caller }) func setVirusTotalApiKey(newKey : Text) : async () {
    virusTotalApiKey := newKey;
  };

  public shared ({ caller }) func setSafeBrowsingApiKey(newKey : Text) : async () {
    safeBrowsingApiKey := newKey;
  };

  public shared ({ caller }) func setWhoisApiKey(newKey : Text) : async () {
    whoisApiKey := newKey;
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

  public shared ({ caller }) func scanUrl(url : Text) : async Text {
    let vtUrl = "https://www.virustotal.com/api/v3/urls/scan";
    let vtHeaders = [{ name = "x-apikey"; value = virusTotalApiKey }];
    let postBody = "{ \"url\": \"" # url # "\" }";

    let vtResponse = await makePostOutcall(vtUrl, vtHeaders, postBody);

    let sbUrl = "https://safebrowsing.googleapis.com/v4/threatMatches:find?key=" # safeBrowsingApiKey;

    let sbPayload = "{" # "\"client\": { \"clientId\": \"ic_cybersec_app\", \"clientVersion\": \"1.0.0\" }," # "\"threatInfo\": { \"threatTypes\": [\"MALWARE\", \"SOCIAL_ENGINEERING\"], \"platformTypes\": [\"ANY_PLATFORM\"], \"threatEntryTypes\": [\"URL\"], \"threatEntries\": [{ \"url\": \"" # url # "\" }] }" # "}";

    let sbHeaders : [Header] = [];

    let sbResponse = await makePostOutcall(sbUrl, sbHeaders, sbPayload);

    let resultSummary = {
      verdict = "SAFE";
      threatsFound = [];
      riskScore = 10;
      resolverName = "";
      recordType = "";
      recordValue = "";
    };

    let historyEntry : ScanHistoryEntry = {
      target = url;
      scanType = #url;
      timestamp = Time.now();
      summary = resultSummary;
    };

    let historySize = scanHistory.size();
    if (historySize >= 20) {
      let entries = scanHistory.toArray().sliceToArray(1, historySize);
      scanHistory.clear();
      scanHistory.addAll(entries.values());
    };
    scanHistory.add(historyEntry);

    vtResponse # " | " # sbResponse;
  };

  public shared ({ caller }) func lookupDns(domain : Text) : async Text {
    let dnsUrl = "https://cloudflare-dns.com/dns-query?name=" # domain # "&type=A";
    let dnsHeaders : [Header] = [{ name = "accept"; value = "application/dns-json" }];

    let dnsResponse = await makeGetOutcall(dnsUrl, dnsHeaders);

    let whoisUrl = "https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey=" # whoisApiKey # "&domainName=" # domain # "&outputFormat=JSON";
    let whoisHeaders : [Header] = [];

    let whoisResponse = await makeGetOutcall(whoisUrl, whoisHeaders);

    let resultSummary = {
      verdict = "SAFE";
      threatsFound = [];
      riskScore = 5;
      resolverName = "Cloudflare";
      recordType = "A";
      recordValue = dnsResponse;
    };

    let historyEntry : ScanHistoryEntry = {
      target = domain;
      scanType = #dns;
      timestamp = Time.now();
      summary = resultSummary;
    };

    let historySize = scanHistory.size();
    if (historySize >= 20) {
      let entries = scanHistory.toArray().sliceToArray(1, historySize);
      scanHistory.clear();
      scanHistory.addAll(entries.values());
    };
    scanHistory.add(historyEntry);

    dnsResponse # " | " # whoisResponse;
  };

  public shared ({ caller }) func getScanHistory() : async [ScanHistoryEntry] {
    scanHistory.toArray().sort();
  };

  public shared ({ caller }) func getHistoryEntryByTarget(target : Text) : async ScanHistoryEntry {
    switch (scanHistory.find(func(entry) { entry.target == target })) {
      case (?entry) { entry };
      case (null) { Runtime.trap("History entry for target " # target # "\" not found!") };
    };
  };

  public query ({ caller }) func ping() : async Text {
    "pong";
  };
};
