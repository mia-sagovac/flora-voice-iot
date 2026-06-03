#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

#define DHTPIN 4
#define DHTTYPE DHT11
#define RELAY_PIN 5   //  GPIO za relej

const char* ssid = "USER";
const char* password = "LOZINKA";

// ThingsBoard MQTT
const char* mqtt_server = "161.53.133.253";
//const char* token = "ipLsW8EyaivjtvIkruGS";
const char* token = "DB7Qn7MI9Fx9Cr98auks";
WiFiClient espClient;
PubSubClient client(espClient);
DHT dht(DHTPIN, DHTTYPE);
/*
void callback(char* topic, byte* payload, unsigned int length) {
  String message = "";

  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  Serial.print("MQTT message: ");
  Serial.println(message);

  // 💧 PUMPA ON/OFF
  if (message == "ON") {
    //digitalWrite(RELAY_PIN, HIGH);   // ako je active LOW → promijeni
    Serial.println("Pumpa ON");
  }

  if (message == "OFF") {
    //digitalWrite(RELAY_PIN, LOW);
    Serial.println("Pumpa OFF");
  }
}

*/
// 🔥 MQTT CALLBACK (primanje komandi s ThingsBoarda)
void callback(char* topic, byte* payload, unsigned int length) {

  String message = "";

  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  Serial.print("RAW MQTT: ");
  Serial.println(message);

  // 📌 Extract requestId from topic
  String topicStr = String(topic);
  String requestId = topicStr.substring(topicStr.lastIndexOf('/') + 1);

  // 📌 Parse JSON
  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, message);

  if (error) {
    Serial.println("JSON parse error");
    return;
  }

  const char* method = doc["method"];
  int duration = doc["params"]["duration"] | 0;

  bool pumpState = false;

  // 💧 LOGIKA
  if (strcmp(method, "ON") == 0 || strcmp(method, "setPump") == 0) {
    pumpState = true;
  }

  if (strcmp(method, "OFF") == 0) {
    pumpState = false;
  }

  digitalWrite(RELAY_PIN, pumpState ? HIGH : LOW);

  Serial.print("Pump: ");
  Serial.println(pumpState ? "ON" : "OFF");

  // ⏱ duration control (optional)
  if (duration > 0 && pumpState) {
    delay(duration);
    digitalWrite(RELAY_PIN, LOW);
    pumpState = false;
  }

  // 📤 RPC RESPONSE (OVO JE BITNO)
  String responseTopic = "v1/devices/me/rpc/response/" + requestId;
  String responsePayload = "{\"status\":\"ok\",\"pump\":" + String(pumpState ? "true" : "false") + "}";

  client.publish(responseTopic.c_str(), responsePayload.c_str());

  Serial.println("RPC response sent");
}
// WiFi connect
void connectWiFi() {
  Serial.println("Connecting WiFi...");
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi connected");
  Serial.println(WiFi.localIP());
}

// MQTT reconnect
void reconnectMQTT() {
  while (!client.connected()) {
    Serial.print("Connecting MQTT...");

    if (client.connect("ESP32Client", token, NULL)) {
      Serial.println("connected");

      // 👇 SUBSCRIBE za komande pumpe
      client.subscribe("v1/devices/me/rpc/request/+");

    } else {
      Serial.print("failed, rc=");
      Serial.println(client.state());
      delay(2000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  delay(2000);

  dht.begin();

  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW); // start OFF

  connectWiFi();

  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);
}

void loop() {

  if (!client.connected()) {
    reconnectMQTT();
  }

  client.loop();

  float t = dht.readTemperature();
  float h = dht.readHumidity();

  if (isnan(t) || isnan(h)) {
    Serial.println("DHT error");
    delay(2000);
    return;
  }

  // 📤 ThingsBoard telemetry
  String payload = "{";
  payload += "\"temperature\":" + String(t) + ",";
  payload += "\"humidity\":" + String(h);
  payload += "}";

  Serial.println(payload);
  client.publish("v1/devices/me/telemetry", payload.c_str());

  delay(5000);
}