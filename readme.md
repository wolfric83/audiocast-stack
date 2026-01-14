
IMPORTANT!!!

Update icecast.xml
```
    <authentication>
        <source-password>hackme</source-password>
        <relay-password>hackme</relay-password>
        <admin-user>admin</admin-user>
        <admin-password>hackme</admin-password>
    </authentication>
```
Update radio.liq to match

liquidsoap generates playlist, and now playing json

Logo assets not saved with this repository, and must be wget/curl'd into the web/assets/ folder

Playback Overlay (grabs now playing json):
http://\<hostname>:8000/liquid/nowplaying.html

Schedule Overlay
http://\<hostname>:8000/liquid/obs.html?src=http://\<hostname>:8787/conference.json&offsetDays=8
