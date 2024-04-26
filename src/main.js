const { invoke } = window.__TAURI__.tauri

var map = L.map('map').setView([50, 14.5], 5);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 10,
    minZoom: 3,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

window.datetime = '2023080112'

get_data('C:/Users/potuz/Desktop/UFA/kaca/rust-mapa/data/data.csv').then(function(response) {
    window.data = response
    showPoints(window.datetime, window.data)
})

function showPoints(datetime, data, zoom=5) {
    let icons = [];
    data.data[datetime].forEach(value => {
        icons.push(L.divIcon({className: 'number-icon', html: `<b style='--zoom: ${zoom}'>` + parseFloat(value).toFixed(2) + "</b>"}));
    })
    for (let i = 0; i < icons.length; i++) {
        L.marker([data.locations[i][1], data.locations[i][0]], {icon: icons[i]}).addTo(map)
    }
}

map.on('zoomend', function() {   
    var currentZoom = parseInt(map.getZoom());
    map.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
           layer.remove();
        }
      });
    showPoints(window.datetime, window.data, zoom=currentZoom)
});

async function get_data(filename) {
    response = await invoke('get_data', {filename:filename})
        .then((response) => {
            return response;
        })
    return JSON.parse(response)
}