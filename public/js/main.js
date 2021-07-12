const getDevices = async () => {
    const devices = document.getElementById('devices');
    let deviceData;
    try {
        const response = await fetch('/devices');
        if (response.status !== 200)
            throw new Error('Could not fetch devices');
        deviceData = await response.json();
        devices.innerHTML = "";

        for (const p in deviceData) /*for (p = 0; p < Object.keys(deviceData).length; p++)*/{
            console.log(p);
            var listItem = document.createElement("li"); // Create li element
            var listItemText = document.createTextNode(deviceData[p]["name"]); // Create text for the li
            console.log(deviceData[p]["name"]);
            listItem.appendChild(listItemText); // Add text to the li
            devices.appendChild(listItem); // Add li to the ul

            // Wake Device Button
            var button = document.createElement('button');
            button.id = deviceData[p]["mac"];
            button.classList.add('is-loading','button');
            var buttonText = document.createTextNode('Wake');
            button.appendChild(buttonText);
            listItem.appendChild(button); // Add div to li to appear on hover
            button.onclick = () => {wakeDevice(deviceData[p]["mac"])}; // Wake this mac_addr
            pingDevice(deviceData[p]["ip"], button)

        }
    } catch (e) {
        console.error(e);
        devices.innerHTML = "Could not fetch devices"
    }
}

const pingDevice = async (ip, button) => {
    try {
        const rawResponse = await fetch('/devices/ping', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ip})
        });
        if (rawResponse.status !== 200)
            throw new Error('Could not ping device');
        const response = await rawResponse.json();
        button.classList.remove('is-loading')
        if (response) {
            button.disabled = true;
        }
    } catch (e) {
        console.error(e);
        alert("Could not ping device")
    }
}

const wakeDevice = async (mac) => {
    try {
        const rawResponse = await fetch('/devices/wol', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({mac})
        });
        if (rawResponse.status !== 200)
            throw new Error('Could not wake device');
        const response = await rawResponse.json();
        alert(response);
    } catch (e) {
        console.error(e);
        alert("Could not wake device")
    }
}

document.addEventListener('DOMContentLoaded', (event) => {
    getDevices();
});
