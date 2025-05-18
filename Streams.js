var Streams = ["Stream 1", "Stream 2"]

function Stream1(IMDBID, Season, Episode) {
    let Params
    if (Season != null && Episode != null) {
        Params = `${IMDBID}-${Season}-${Episode}`
    } else {
        Params = IMDBID
    }
    let Response = DataToString(URLRequest("https://movies5.online/movies/media", {"Next-Action": "50648bbc871c4c77283ab5c9a870d999c047fbf5", "Content-Type": "text/plain"}, StringToData(`["${Params}"]`)))
    if (Response == null) {
        return [] // "No Response"
    }
    let M3U8URL = MatchText(Response, "\"sourceUrl\":\"(.*?).m3u8\"")[0]
    if (M3U8URL == null) {
        return [] // "No M3U8 found"
    }
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
    if (DataHash == null) {
        return [] // "No data hash"
    }
    let ProRCP = MatchText(FetchHTML(`https://${Domain}/rcp/${DataHash}`, `https://vidsrc.net/embed/${Params}`, HTML => HTML.includes("player_iframe")), "src: '(.*?)'", false)[0]
    if (ProRCP == null) {
        return [] // "No pro RCP"
    }
    let VideoURL = MatchText(FetchHTML(`https://${Domain}/${ProRCP}`, `https://${Domain}/rcp/${DataHash}`, HTML => HTML.includes(".m3u8")), "src=\"(.*?).m3u8\"", false)[0]
    if (VideoURL == null) {
        return [] // "No video URL"
    }
    return [`${VideoURL}.m3u8`, `https://${Domain}/${ProRCP}`]
}

function FetchHTML(URLString, Referer = null, Condition) {
    WebViewLoad(URLString, Referer)
    let HTML = WebViewRunJS("document.documentElement.outerHTML")
    while (!Condition(HTML)) {
        HTML = WebViewRunJS("document.documentElement.outerHTML")
    }
    WebViewReset()
    return HTML
}
