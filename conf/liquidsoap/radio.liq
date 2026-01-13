#!/usr/bin/liquidsoap

# Log settings
settings.log.level.set(4)

# Create a playlist from the music directory
music = playlist(
  mode="randomize",
  reload_mode="watch",
  "/music"
)

# Add a fallback in case playlist is empty
radio = fallback(
  track_sensitive=false,
  [music, blank()]
)

# Make the source safe
radio = mksafe(radio)

# Function to write now playing metadata to JSON
def write_nowplaying(m) =
  def get_meta(key) =
    if list.mem_assoc(key, m) then
      list.assoc(key, m)
    else
      ""
    end
  end
  
  # Try multiple possible track number metadata keys
  tracknumber = get_meta("tracknumber")
  if tracknumber == "" then tracknumber = get_meta("track") end
  if tracknumber == "" then tracknumber = get_meta("tracknum") end
  
  payload =
    [ ("title", get_meta("title"))
    , ("artist", get_meta("artist"))
    , ("album", get_meta("album"))
    , ("tracknumber", tracknumber)
    ]
  
  file.write(
    append=false,
    data=metadata.json.stringify(payload),
    "/liquidweb/nowplaying.json"
  )
end

# Attach metadata handler to write now playing info on track change
radio = on_metadata(id="nowplaying", radio, write_nowplaying)

# Output to Icecast
output.icecast(
  %mp3(bitrate=128),
  host="icecast",
  port=8000,
  password="hackme",
  mount="/radio.mp3",
  name="My Radio Station",
  description="Streaming from Liquidsoap",
  genre="Various",
  url="http://localhost:8000",
  radio
)