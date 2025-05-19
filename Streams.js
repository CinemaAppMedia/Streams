var Streams = ["Stream 1", "Stream 2", "Stream 3", "Stream 4"]

function Stream1(IMDBID, Season, Episode) {
    let Params
    if (Season != null && Episode != null) {
        Params = `${IMDBID}-${Season}-${Episode}`
    } else {
        Params = IMDBID
    }
    let Response = DataToString(URLRequest("https://movies5.online/movies/media", {"Next-Action": "50648bbc871c4c77283ab5c9a870d999c047fbf5", "Content-Type": "text/plain"}, StringToData(`["${Params}"]`)))
    if (Response == null) return []
    let M3U8URL = MatchText(Response, "\"sourceUrl\":\"(.*?).m3u8\"")[0]
    if (M3U8URL == null) return []
    return [`${M3U8URL}.m3u8`, "https://movies5.online"]
}

function Stream2(IMDBID, Season, Episode) {
    let Params
    if (Season != null && Episode != null) {
        Params = `${IMDBID}/${Season}-${Episode}`
    } else {
        Params = IMDBID
    }
    let Domain = "cloudnestra.com"
    let DataHash = MatchText(`https://vidsrc.net/embed/${Params}`, "<div class=\"server\" data-hash=\"(.*?)\">CloudStream Pro</div>", true)[0]
    if (DataHash == null) return []
    let ProRCP = MatchText(FetchHTML(`https://${Domain}/rcp/${DataHash}`, `https://vidsrc.net/embed/${Params}`, HTML => HTML.includes("player_iframe")), "src: '(.*?)'", false)[0]
    if (ProRCP == null) return []
    let VideoURL = MatchText(FetchHTML(`https://${Domain}/${ProRCP}`, `https://${Domain}/rcp/${DataHash}`, HTML => HTML.includes(".m3u8")), "src=\"(.*?).m3u8\"", false)[0]
    if (VideoURL == null) return []
    return [`${VideoURL}.m3u8`, `https://${Domain}/${ProRCP}`]
}

function Stream3(IMDBID, Season, Episode) {
    let TMDBID = GetTMDBID(IMDBID, Season != null && Episode != null)
    if (TMDBID == null) return []
    let Params
    if (Season != null && Episode != null) {
        Params = `tv/${TMDBID}/${Season}/${Episode}`
    } else {
        Params = `movie/${TMDBID}`
    }
    WebViewLoad(`https://player.vidsrc.co/embed/${Params}?server=1`)
    var VideoURL = ""
    while (VideoURL == "") VideoURL = WebViewRunJS("document.querySelector('video')?.src;")
    WebViewReset()
    return [VideoURL]
}

function Stream4(IMDBID, Season, Episode) {
    let Params
    if (Season != null && Episode != null) {
        Params = `show/${IMDBID}/${String(Season).padStart(2, '0')}-${String(Episode).padStart(2, '0')}`
    } else {
        Params = `movie/${IMDBID}`
    }
    let TokenCode = MatchText(`https://gomo.to/${Params}`, "var tc = '(.*?)'", true)[0]
    if (TokenCode == null) return []
    let Response = DataToString(URLRequest("https://gomo.to/decoding_v3.php", {"X-Token": TokenCode.substring(4, 27).split('').reverse().join('') + "27448069", "Content-Type": "application/x-www-form-urlencoded"}, StringToData(`tokenCode=${TokenCode}`)))
    let DoodStreamURL = null
    try {
        let Parsed = JSON.parse(Response)
        if (Array.isArray(Parsed) && Parsed.every(Item => typeof Item === 'string')) {
            DoodStreamURL = Parsed.find(Item => Item.includes("dood"))
        }
    } catch {
        DoodStreamURL = null
    }
    if (DoodStreamURL == null) return []
    let DoodStreamID = DoodStreamURL.split('/').filter(Boolean).pop()
    if (DoodStreamID == null) return []
    let DownloadURL = MatchText(`https://d000d.com/d/${DoodStreamID}`, "<a href=\"/download/(.*?)\"", true)[0]
    if (DownloadURL == null) return []
    millis(500)
    let MP4URL = MatchText(FetchHTML(`https://d000d.com/download/${DownloadURL}`, `https://d000d.com/d/${DoodStreamID}`, HTML => HTML.includes("Download file")), "<a href=\"(.*?)\" class=\"btn btn-primary d-flex align-items-center justify-content-between\">", false)[0]
    if (MP4URL == null) return []
    return [MP4URL, `https://d000d.com/d/${DoodStreamID}`]
}

// Useful functions
function GetTMDBID(IMDBID, IsShow) {
    let Results = JSON.parse(DataToString(URLRequest(`https://api.themoviedb.org/3/find/${IMDBID}?api_key=b09fa5a94c26c11d6773f3ef07829cfe&external_source=imdb_id`)))[`${IsShow ? "tv" : "movie"}_results`]
    return Results?.length > 0 ? Results[0].id : null
}

function FetchHTML(URLString, Referer = null, Condition) {
    WebViewLoad(URLString, Referer)
    var HTML = ""
    while (!Condition(HTML)) HTML = WebViewRunJS("document.documentElement.outerHTML")
    WebViewReset()
    return HTML
}

function millis(ms) {
    var t1 = Date.now()
    while (Date.now() - t1 < ms) {
    }
}
