var Streams = ["Stream 1", "Stream 2", "Stream 3"]

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
        Params = `mediaType=tv&episodeId=${Episode}&seasonId=${Season}&tmdbId=${TMDBID}`
    } else {
        Params = `mediaType=movie&tmdbId=${TMDBID}`
    }
    let Encrypted = DataToString(URLRequest(`https://api.videasy.net/myflixerzupcloud/sources-with-title?${Params}`))
    let Decrypted = DataToString(URLRequest("https://enc-dec.app/api/dec-videasy", {"Content-Type": "application/json"}, StringToData(`{\"text\": \"${Encrypted}\", \"id\": \"${TMDBID}\"}`)))
    let Result = JSON.parse(Decrypted).result
    if (Result == null) return []
    let Sources = Result.sources
    if (Sources.length < 1) return []
    return [Sources[0].url, "https://player.videasy.net"]
}

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
