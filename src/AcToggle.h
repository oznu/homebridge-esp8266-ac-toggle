#ifndef AcToggle_h
#define AcToggle_h

#include <EEPROM.h>
#include <ArduinoJson.h>              // v5.13.2 - https://github.com/bblanchon/ArduinoJson
#include <WebSocketsServer.h>         // v2.2.0 - https://github.com/Links2004/arduinoWebSockets

#include "settings.h"
#include "auth.h"

class AcToggle {
  public:
    WebSocketsServer webSocket = WebSocketsServer(81);

    AcToggle(void);

    bool active = false;

    void begin();
    void loop ();
    void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length);
    bool validateHttpHeader(String headerName, String headerValue);

    void processIncomingRequest(String payload);
    void triggerContactRelay(unsigned long contactTime);
    void broadcastSystemStatus();
};

#endif