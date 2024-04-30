const { invoke } = window.__TAURI__.tauri

var map = L.map('map').setView([50, 14.5], 5);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 10,
    minZoom: 3,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

const squareRadiusMeters = 100000;

get_config().then((config) => {
    window.config = config
    window.data = {}
    window.markers = []

    get_data(window.config['filenames']["gradT"]).then(function(response) {
        window.data["gradT"] = response
        if (!(response)) { showFlashAlert('No gradT data - unable to show locations') }
        window.locations = response["locations"]
    })
    get_data(window.config['filenames']["front"]).then(function(response) {
        window.data["front"] = response
    })
    get_data(window.config['filenames']["vMer"]).then(function(response) {
        window.data["vMer"] = response
        get_data(window.config['filenames']["vZon"]).then(function(response) {
            window.data["vZon"] = response
        })
    })
    get_data(window.config['filenames']["mlWmaxshear"]).then(function(response) {
        window.data["mlWmaxshear"] = response
    })

    let iso_date = convertToISO(window.config["datetime"]);
    document.getElementById('date-input').value = iso_date

    let hour = window.config["datetime"].substring(8, 10);
    document.getElementById('time-select').value = hour

    document.getElementById('gradT-input').checked = window.config["showGradT"]
    document.getElementById('front-input').checked = window.config["showFront"]
    document.getElementById('v-input').checked = window.config["showV"]
    document.getElementById('mlWmaxshear-input').checked = window.config["showMlWmaxshear"]
})

const zeroPad = (num, places) => String(num).padStart(places, '0')

function calcAngleDegrees(x, y) {
    return (Math.atan2(y, x) * 180) / Math.PI;
}

// #region flashalert
function createElementFromHTML(htmlString) {
    let div = document.createElement('div');
    div.innerHTML = htmlString.trim();
    return div.firstChild;
}

function setParentDisplayNone(element) {
    element.parentNode.style.display = 'none';
}

function showFlashAlert(message, category='') {
    let eleString = `<div class="alert alert-${category}">
            ${message} <i onclick="setParentDisplayNone(this)" class="fa fa-xmark"></i>
        </div>`
    let ele = createElementFromHTML(eleString)
    document.body.insertBefore(ele, document.body.firstChild)
}
// #endregion flashalert

function showPoints(locations) {
    locations.forEach(location => {
        lat = location[1]
        lng = location[0]
        let icon = L.divIcon({className: 'location-icon', html: "<i class='fa fa-circle'></i>"});
        let marker = L.marker([lat, lng], {icon: icon})
        marker.addTo(map)
        window.markers.push(marker)
    })
}

function showPointsGradT(datetime, data) {
    if (!(datetime in data.data)) {
        showFlashAlert('Missing gradT data for ' + datetime)
        return
    }
    for (let i = 0; i < data.data[datetime].length; i++) {
        var value = data.data[datetime][i]; 
        let color = '#fff';
        if (value > 1) {
            color = '#fff2cc'
        }
        if (value > 2) {
            color = '#ffd966'
        }
        if (value > 3) {
            color = '#bf8f00'
        }
        if (value > 4) {
            color = '#806000'
        }
        let icon = L.divIcon({className: 'number-icon icon-under', html: "<b>" + parseFloat(value).toFixed(2) + "</b>"});
        lat = data.locations[i][1]
        lng = data.locations[i][0]
        let bounds = L.latLng(lat, lng).toBounds(squareRadiusMeters); 
        let rect = L.rectangle(bounds, {color: color, weight: 0, fillOpacity: .6});
        rect.addTo(map)
        window.markers.push(rect)
        let marker = L.marker([lat, lng], {icon: icon})
        marker.addTo(map)
        window.markers.push(marker)
    }
}

// ukazuje -1 pro teplou a 1 pro studenou frontu - obsolete
function showPointsFront(datetime, data) {
    if (!(datetime in data.data)) {
        showFlashAlert('Missing front data for ' + datetime)
        return
    }
    for (let i = 0; i < data.data[datetime].length; i++) {
        var value = data.data[datetime][i];
        if (value == -777) {continue}
        let color = '#ff0000';
        if (value == -1) {
            color = '#0000ff';
        }
        let icon = L.divIcon({className: 'number-icon icon-above', html: `<b style='color: ${color}'>${value}</b>`});
        lat = data.locations[i][1]
        lng = data.locations[i][0]
        let marker = L.marker([lat, lng], {icon: icon})
        marker.addTo(map)
        window.markers.push(marker)
    }
}

function showPointsV(datetime, dataMer, dataZon) {
    if (!(datetime in dataMer.data)) {
        showFlashAlert('Missing v data (vMer) for ' + datetime)
        return
    }
    if (!(datetime in dataZon.data)) {
        showFlashAlert('Missing v data (vZon) for ' + datetime)
        return
    }
    for (let i = 0; i < dataMer.data[datetime].length; i++) {
        var vMer = dataMer.data[datetime][i];
        var vZon = dataZon.data[datetime][i];
        if (vMer == -777) {continue}
        if (vZon == -777) {continue}

        let angleDeg = calcAngleDegrees(vZon, vMer)
        let length = Math.sqrt(vZon**2 + vMer**2)
        
        let color = 'black'
        if (window.data["front"]) {
            if (window.data["front"].data[datetime][i] == 1) {color = 'red'}
            if (window.data["front"].data[datetime][i] == -1) {color = 'blue'}
        }

        let icon = L.divIcon({className: `arrow-icon icon-above arrow-${color}`, html: `<i style="--rotate: ${angleDeg}deg; --length: ${length}"></i>`});
        lat = dataMer.locations[i][1]
        lng = dataMer.locations[i][0]
        let marker = L.marker([lat, lng], {icon: icon})
        marker.addTo(map)
        window.markers.push(marker)
    }
}

function showPointsMlWmaxshear(datetime, data) {
    if (!(datetime in data.data)) {
        showFlashAlert('Missing mlWmaxshear data for ' + datetime)
        return
    }
    for (let i = 0; i < data.data[datetime].length; i++) {
        var value = data.data[datetime][i];
        if (value == -777) {continue}

        let icon = L.divIcon({className: 'number-icon icon-above', html: `<b>${value}</b>`});
        lat = data.locations[i][1]
        lng = data.locations[i][0]
        let marker = L.marker([lat, lng], {icon: icon})
        marker.addTo(map)
        window.markers.push(marker)

        let icon2 = L.divIcon({className: 'location-icon', html: "<i class='fa fa-circle'></i>"});
        let marker2 = L.marker([lat, lng], {icon: icon2})
        marker2.addTo(map)
        window.markers.push(marker2)
    }
}

function convertToISO(dateStr) {
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    const isoDate = `${year}-${month}-${day}`;
    return isoDate;
}

function addHoursToDateTime(datetime, n) {
    if (datetime.length !== 10 || isNaN(parseInt(datetime)) || isNaN(parseInt(n))) {
        throw new Error("Invalid input");
    }

    const year = parseInt(datetime.substring(0, 4));
    const month = parseInt(datetime.substring(4, 6));
    const day = parseInt(datetime.substring(6, 8));
    const hour = parseInt(datetime.substring(8, 10));

    let date = new Date(year, month - 1, day, hour);

    date.setHours(date.getHours() + n);

    const formattedYear = date.getFullYear().toString();
    const formattedMonth = (date.getMonth() + 1).toString().padStart(2, '0');
    const formattedDay = date.getDate().toString().padStart(2, '0');
    const formattedHour = date.getHours().toString().padStart(2, '0');

    return formattedYear + formattedMonth + formattedDay + formattedHour;
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
    if (response == 'Data loading failed') {
        showFlashAlert('data loading failed - ' + filename)
        return
    }
    return JSON.parse(response)
}

async function get_config() {
    response = await invoke('get_config')
        .then((response) => {
            return response;
        })
    return JSON.parse(response)
}

async function set_config(configStr) {
    response = await invoke('set_config', {configStr:configStr})
}

function reload() {
    window.config['showGradT'] = document.getElementById('gradT-input').checked
    window.config['showFront'] = document.getElementById('front-input').checked
    window.config['showV'] = document.getElementById('v-input').checked
    window.config['showMlWmaxshear'] = document.getElementById('mlWmaxshear-input').checked

    window.markers.forEach(marker => {
        map.removeLayer(marker)
    })
    let date_iso = document.getElementById('date-input').value;
    let date = new Date(date_iso);

    let year = date.getFullYear();
    let month = (date.getMonth() + 1).toString().padStart(2, '0');
    let day = date.getDate().toString().padStart(2, '0');
    let formattedDate = `${year}${month}${day}`;

    let hour = zeroPad(document.getElementById('time-select').value, 2)
    let datetime = formattedDate + hour
    
    if (datetime.length != 10) {
        // DODELAT ERROR MESSAGE
        return
    }

    window.config['datetime'] = datetime

    if (window.config['showGradT']) { showPointsGradT(datetime, window.data["gradT"]); }
    if (window.config['showV']) { showPointsV(datetime, window.data["vMer"], window.data["vZon"]) }
    if (window.config['showFront']) { showPointsFront(datetime, window.data["front"]) }

    if (window.config['showGradT'] || window.config['showV'] || window.config['showFront']) {
        showPoints(window.locations)
    }

    if (window.config['showMlWmaxshear']) { showPointsMlWmaxshear(datetime, window.data["mlWmaxshear"]) }

    let datetimeDisplayEle = document.getElementById('datetime-display')
    prettyDatetime = `${day}.${month}.${year} ${hour}h`
    datetimeDisplayEle.innerText = prettyDatetime

    set_config(JSON.stringify(window.config, null, 4))
}

function forw() {
    window.config['datetime'] = addHoursToDateTime(window.config['datetime'], 12)
    let iso_date = convertToISO(window.config["datetime"]);
    document.getElementById('date-input').value = iso_date

    let hour = window.config["datetime"].substring(8, 10);
    document.getElementById('time-select').value = hour

    reload()
}

function back() {
    window.config['datetime'] = addHoursToDateTime(window.config['datetime'], -12)
    let iso_date = convertToISO(window.config["datetime"]);
    document.getElementById('date-input').value = iso_date

    let hour = window.config["datetime"].substring(8, 10);
    document.getElementById('time-select').value = hour

    reload()
}

document.getElementById('reload-button').addEventListener('click', e => {
    reload();
})