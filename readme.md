IMPORTANT!!!

Update icecast.xml
    <authentication>
        <source-password>hackme</source-password>
        <relay-password>hackme</relay-password>
        <admin-user>admin</admin-user>
        <admin-password>hackme</admin-password>
    </authentication>

Update radio.liq to match

liquidsoap generates playlist, and now playing json


Playback Overlay (grabs now playing json):
http://cast.troubleandstrife.casa:8000/liquid/overlay.html

Schedule Overlay
http://cast.troubleandstrife.casa:8000/liquid/obs.html?src=http://cast.troubleandstrife.casa:8787/conference.json&offsetDays=8