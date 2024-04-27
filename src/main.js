const { invoke } = window.__TAURI__.tauri

var map = L.map('map').setView([50, 14.5], 5);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 10,
    minZoom: 3,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

const squareRadiusMeters = 100000;

window.datetime = '2023080112'
window.filenames = {
    "gradT": 'C:/Users/potuz/Desktop/UFA/kaca/rust-mapa/data/gradT.csv',
    "vMer": undefined,
    "vMez": undefined,
    "front": 'C:/Users/potuz/Desktop/UFA/kaca/rust-mapa/data/fronta.csv',
}
window.data = {}

get_data(window.filenames["gradT"]).then(function(response) {
    window.data["gradT"] = response
    showPointsGradT(window.datetime, window.data["gradT"])
})
get_data(window.filenames["front"]).then(function(response) {
    window.data["front"] = response
    showPointsFront(window.datetime, window.data["front"])
})

function showPointsGradT(datetime, data) {
    for (let i = 0; i < data.data[datetime].length; i++) {
        var value = data.data[datetime][i]; 
        var color = '#00ff00dd';
        if (value < 1) {
            color = '#0000ffdd';
        }
        let icon = L.divIcon({className: 'number-icon', html: "<b>" + parseFloat(value).toFixed(2) + "</b>"});
        lat = data.locations[i][1]
        lng = data.locations[i][0]
        let bounds = L.latLng(lat, lng).toBounds(squareRadiusMeters); 
        L.rectangle(bounds, {color: color, weight: 0}).addTo(map);
        L.marker([lat, lng], {icon: icon}).addTo(map)
    }
}

function showPointsFront(datetime, data) {
    //dodelat
}

map.on('zoomend', function() {   
    var currentZoom = map.getZoom();
    document.body.style.setProperty('--current-zoom', currentZoom);
});

async function get_data(filename) {
    response = await invoke('get_data', {filename:filename})
        .then((response) => {
            return response;
        })
    return JSON.parse(response)
}

document.getElementById('datetime-input').addEventListener('input', e => {
    let date_iso = document.getElementById('datetime-input').value;
    let date = new Date(date_iso);

    let year = date.getFullYear();
    let month = (date.getMonth() + 1).toString().padStart(2, '0');
    let day = date.getDate().toString().padStart(2, '0');
    let hours = date.getHours().toString().padStart(2, '0');

    let formattedDate = `${year}${month}${day}${hours}`;
    console.log(formattedDate);
    showPoints(formattedDate, window.data);
})