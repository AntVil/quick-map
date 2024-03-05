const RESOLUTION = 4;
const MARGIN_FACTOR = 0.9;
const NUMBER_REGEX = /-?\d+(\.\d+)?/g;

let menu;
let lat;
let lon;
let canvas;
let ctxt;
let map;

window.onload = async () => {
    menu = document.getElementById("menu");
    lat = document.getElementById("lat");
    lon = document.getElementById("lon");
    canvas = document.getElementById("map");
    canvas.width = 360 * RESOLUTION;
    canvas.height = 180 * RESOLUTION;
    ctxt = canvas.getContext("2d");

    let settings = updateSettings();

    map = new GeoMap(settings);
    await map.loadData();

    let lats = (localStorage.getItem("lats") ?? "").split(",").map(parseFloat);
    let lons = (localStorage.getItem("lons") ?? "").split(",").map(parseFloat);

    lat.value = lats.join("\n")
    lon.value = lons.join("\n")

    if(lats.length > 0 && lons.length > 0) {
        map.renderWithPoints(lats, lons);
    } else {
        map.renderFull();
    }
}

function updateSettings() {
    let parameters = new URLSearchParams(window.location.search);

    let scale = parameters.get("scale");
    if(!["10m", "50m", "110m"].includes(scale)) {
        scale = "110m";
    }
    parameters.set("scale", scale);

    let margin = parseFloat(parameters.get("margin"));
    if(!(margin >= 0 && margin <= 100)) {
        margin = 0.1;
    }
    parameters.set("margin", margin);

    // update url without reload
    let url = window.location.pathname + "?" + parameters.toString();
    history.pushState(null, "", url);

    return {
        "scale": scale,
        "margin": margin
    }
}

function getLats() {
    return [...lat.value.matchAll(NUMBER_REGEX)
        .map(parseFloat)
        .filter(Number.isFinite)
        .filter(y => y >= -90 && y <= 90)
    ];
}

function getLons() {
    return [...lon.value.matchAll(NUMBER_REGEX)
        .map(parseFloat)
        .filter(Number.isFinite)
        .filter(x => x >= -180 && x <= 180)
    ];
}

function storeLat() {
    localStorage.setItem("lats", getLats().join(","));
}

function storeLon() {
    localStorage.setItem("lons", getLons().join(","))
}

function render() {
    menu.checked = false;

    let lats = getLats();
    let lons = getLons();

    map.renderWithPoints(lats, lons);
}

function addPosition(e) {
    e.preventDefault();
    // cannot use offsetX/Y because of css stretching
    let rect = canvas.getBoundingClientRect();
    let x = canvas.width * ((e.clientX - rect.left) / rect.width)
    let y = canvas.height * ((e.clientY - rect.top) / rect.height)

    let mat = ctxt.getTransform()

    let newLon = (x - mat.e) / mat.a;
    let newLat = (y - mat.f) / mat.d;

    lat.value = `${newLat}\n${lat.value}`;
    lon.value = `${newLon}\n${lon.value}`;

    storeLat();
    storeLon();

    render();
}
