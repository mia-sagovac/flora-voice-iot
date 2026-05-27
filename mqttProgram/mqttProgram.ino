// Napišite program za uređaj ESP32 koji se preko WiFi mreže povezuje na MQTT posrednik. Nakon pokretanja
// programa i povezivanja na WiFi mrežu, osluškuje očitanja pokreta s pripadajućeg PIR ili ultrazvučnog senzora.
// Kada se dogodi očitanje, uređaj treba poslati MQTT poruku na posrednik o očitanju pokreta s vrijednošću
// „detected“
// . Uređaj treba očitavati vrijednost senzora svakih 5 sekundi i ako je posljednje očitanje bilo
// „detected“, a trenutno nije detektirano ništa, pošaljite vrijednost „clear“. Također, šaljite „detected“ samo
// ako je posljednje očitanje bilo „clear“.

#include <PubSubClient.h>
#include <WiFi.h>
#include <WiFiManager.h>
#include <ArduinoJson.h>
#include <DHT.h>




// const char *ssid = "WIFI";
// const char *password = "WIFI_PASSWORD";
const char* MQTT_server = "http://161.53.133.253:8080";  
const int MQTT_port = 1883;
const char* MQTT_topic = "v1/devices/me/telemetry";

int PIR_OUT_GPIO_pin = 13;

WiFiClient espClient;
PubSubClient client(espClient);

String lastState = "clear";
unsigned long lastReadTime = 0;
const unsigned long readInterval = 5000; // 5 sekundi
// const unsigned long readInterval = 1800000; // 30 minuta



void setup() {
  // put your setup code here, to run once:

    Serial.begin(115200);
    pinMode(PIR_OUT_GPIO_pin, INPUT);

    // ============ CONNECTING TO WIFI =============
    Serial.printf("[WiFi] Connecting to ");
    Serial.printf(ssid);
    // WiFi.begin(ssid, password);
    WiFiManager wm;

    if (!wm.autoConnect("ESP32_PIR_Setup")) {
        Serial.println("Spajanje nije uspjelo. Resetiraj uređaj.");
        ESP.restart();
    }

    Serial.println("WiFi spojen!");
    client.setServer(MQTT_server, MQTT_port);

}

void loop() {
    if (WiFi.status() != WL_CONNECTED) {
        return;
    }
  // put your main code here, to run repeatedly:
    if(!client.connected()){
        while(!client.connected()){
            String clientID = "CLIENTID";
            const char* accessToken = "DB7Qn7MI9Fx9Cr98auks";

            if (client.connect(clientID.c_str(), accessToken, NULL)) {
                Serial.printf("connected\n");
            } else {
                Serial.printf("failed: %d\nRetry", client.state());
                delay(2000);
                return;
            }
        }
  
    }

    client.loop();

    unsigned long currentTime = millis();

    if(currentTime - lastReadTime >= readInterval){
        lastReadTime = currentTime;

        int sensorValue = digitalRead(PIR_OUT_GPIO_pin);

        String currentState;

        if (sensorValue == HIGH) {
            currentState = "detected";
        } else {
            currentState = "clear";
        }



        // salje uvijek podatke promijenili se on ili ne
        String payload = "{\"" + String("motion") + "\":\"" + currentState + "\"}";
        client.publish(MQTT_topic, payload.c_str());
        
        Serial.print("MQTT sent: ");
        Serial.println(payload);
        lastState = currentState;


    }
}













