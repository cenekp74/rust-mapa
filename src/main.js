const { invoke } = window.__TAURI__.tauri

var map = L.map('map').setView([50, 14.5], 5);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

var numberIcon = L.divIcon({className: 'number-icon', html: "<b>" + 5 + "</b>"});
L.marker([50, 14], {icon: numberIcon}).addTo(map);

async function get_data(filename) {
    await invoke('get_data', {filename:filename})
        .then((response) => {
            console.log(response)
    })
}