#include <WiFi.h>
#include <WiFiManager.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

#define DHTPIN 4
#define DHTTYPE DHT11
#define RELAY_PIN 5

// ThingsBoard
const char* mqtt_server = "161.53.133.253";
const char* token = "ipLsW8EyaivjtvIkruGS"; // sensor/plant token

WiFiClient espClient;
PubSubClient client(espClient);
DHT dht(DHTPIN, DHTTYPE);


bool pumpState = false;
unsigned long pumpOffTime = 0;
unsigned long lastTelemetryTime = 0;
const unsigned long TELEMETRY_INTERVAL = 5000; //send every 5 seconds



void callback(char* topic, byte* payload, unsigned int length) {

  String message = "";

    for (unsigned int i = 0; i < length; i++) {
      message += (char)payload[i];
  }


  String topicStr = String(topic);
  String requestId = topicStr.substring(topicStr.lastIndexOf('/') + 1);

  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, message);

  if (error) {
    Serial.println("JSON parsing error");
    return;
  }

  const char* method = doc["method"] | "";
  int duration = doc["params"]["duration"] | 0;

  if (strcmp(method, "ON") == 0 || strcmp(method, "setPump") == 0) {
    pumpState = true;
  } else if (strcmp(method, "OFF") == 0) {
    pumpState = false;
  }

  digitalWrite(RELAY_PIN, pumpState ? HIGH : LOW);

  Serial.print("Pump: ");
  Serial.println(pumpState ? "ON" : "OFF");

  // timer
  if (duration > 0 && pumpState) {
    Serial.print("Pump will run for ");
    Serial.print(duration);
    Serial.println(" ms");
    
    pumpOffTime = millis() + duration; 
  } else {
    pumpOffTime = 0; 
  }

  String responseTopic = "v1/devices/me/rpc/response/" + requestId;
  String responsePayload = "{\"status\":\"ok\",\"pump\":" + String(pumpState ? "true" : "false") + "}";

  client.publish(responseTopic.c_str(), responsePayload.c_str());
  Serial.println("RPC response sent");
}

// WiFiManager 
void connectWiFi() {

  WiFiManager wm;
  Serial.println("Running WiFi Manager...");

  bool res = wm.autoConnect("ESP32-Pump");

  if (!res) {
    Serial.println("Error connecting to WiFi");
    delay(3000);
    ESP.restart();
  }

  Serial.println("WiFi connected");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
}

// MQTT reconnect
void reconnectMQTT() {

  while (!client.connected()) {
    Serial.print("Connecting MQTT");

    String clientId = "ESP32-" + String((uint32_t)ESP.getEfuseMac(), HEX);

    if (client.connect(clientId.c_str(), token, NULL)) {
      Serial.println("connected");
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
  digitalWrite(RELAY_PIN, LOW);

  connectWiFi();

  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);
}

void loop() {

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected");
  }

  if (!client.connected()) {
    reconnectMQTT();
  }


  client.loop(); 

  // check pump timer
  if (pumpState && pumpOffTime > 0 && millis() >= pumpOffTime) {
    digitalWrite(RELAY_PIN, LOW);
    pumpState = false;
    pumpOffTime = 0;
    Serial.println("Pump turned OFF by timer");
    
    String payload = "{\"pump\":0}";
    client.publish("v1/devices/me/telemetry", payload.c_str());
  }

  //telemetry
  if (millis() - lastTelemetryTime >= TELEMETRY_INTERVAL) {
    lastTelemetryTime = millis();

    float t = dht.readTemperature();
    float h = dht.readHumidity();

    if (isnan(t) || isnan(h)) {
      Serial.println("DHT error");
    } else {
      String payload = "{";
      payload += "\"temperature\":";
      payload += String(t);
      payload += ",";
      payload += "\"humidity\":";
      payload += String(h);
      payload += ",";
      payload += "\"pump\":";
      payload += String(digitalRead(RELAY_PIN) ? 1 : 0);
      payload += "}";

      Serial.println(payload);
      client.publish("v1/devices/me/telemetry", payload.c_str());
    }
  }
}
