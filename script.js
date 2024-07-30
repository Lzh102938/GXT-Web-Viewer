document.getElementById('browseButton').addEventListener('click', () => {
    document.getElementById('fileInput').click();
});

document.getElementById('fileInput').addEventListener('change', handleFileSelect);

document.getElementById('convertButton').addEventListener('click', convertUsingTable);
document.getElementById('saveButton').addEventListener('click', saveGeneratedTxt);
document.getElementById('clearButton').addEventListener('click', clearTable);

document.querySelector('.close').addEventListener('click', () => {
    document.getElementById('aboutModal').style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target == document.getElementById('aboutModal')) {
        document.getElementById('aboutModal').style.display = 'none';
    }
});

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file && file.name.endsWith('.gxt')) {
        console.log(`Selected file: ${file.name}`);
        parseGxtFile(file);
    } else {
        alert('无效的GXT文件路径！');
    }
}

function parseGxtFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const buffer = e.target.result;
        console.log(`File loaded: ${buffer.byteLength} bytes`);
        try {
            const texts = parseGXT(buffer);
            displayGxtContentInTable(texts);
        } catch (error) {
            console.error(`Error parsing GXT file: ${error}`);
            alert('解析GXT文件时出错');
        }
    };
    reader.readAsArrayBuffer(file);
}

function parseGXT(buffer) {
    const dataView = new DataView(buffer);
    const version = getVersion(dataView);
    console.log(`GXT version: ${version}`);
    const reader = getReader(version);

    if (reader === null) {
        alert('未知GXT版本！');
        return [];
    }

    if (reader.hasTables()) {
        const tables = reader.parseTables(dataView);
        return tables.flatMap(table => reader.parseTKeyTDat(dataView, table.offset));
    } else {
        return reader.parseTKeyTDat(dataView);
    }
}

function getVersion(dataView) {
    const bytes = new Uint8Array(dataView.buffer.slice(0, 8));

    // Check for IV version
    const version = dataView.getUint16(0, true);
    const bitsPerChar = dataView.getUint16(2, true);
    if (version === 4 && bitsPerChar === 16) {
        return 'iv';
    }

    // Check for SA version
    const word1 = dataView.getUint16(0, true);
    const word2 = dataView.getUint16(2, true);
    if (word1 === 4 && bytes.slice(4, 8).toString() === '84,65,66,76') {  // 'TABL'
        if (word2 === 8) {
            return 'sa';
        }
        if (word2 === 16) {
            return 'sa-mobile';
        }
    }

    // Check for VC version
    if (bytes.slice(0, 4).toString() === '84,65,66,76') {  // 'TABL'
        return 'vc';
    }

    // Check for III version
    if (bytes.slice(0, 4).toString() === '84,75,69,89') {  // 'TKEY'
        return 'iii';
    }

    return null;
}

function getReader(version) {
    switch (version) {
        case 'vc':
            return new VC();
        case 'sa':
        case 'sa-mobile':
            return new SA();
        case 'iii':
            return new III();
        case 'iv':
            return new IV();
        default:
            return null;
    }
}

class III {
    hasTables() {
        return false;
    }

    parseTables() {
        return [];
    }

    parseTKeyTDat(stream) {
        const { offset: tkeyOffset, size: tkeySize } = findBlock(stream, 'TKEY');
        const TKey = [];

        for (let i = 0; i < tkeySize / 12; i++) {
            TKey.push({
                offset: stream.getUint32(tkeyOffset + i * 12, true),
                key: new Uint8Array(stream.buffer.slice(tkeyOffset + i * 12 + 4, tkeyOffset + i * 12 + 12)),
            });
        }

        const { offset: tdatOffset, size: tdatSize } = findBlock(stream, 'TDAT');
        const TDat = new Uint8Array(stream.buffer.slice(tdatOffset, tdatOffset + tdatSize));

        return TKey.map(entry => {
            const key = new TextDecoder().decode(entry.key).split('\x00')[0];
            const value = new TextDecoder('utf-16').decode(TDat.slice(entry.offset)).split('\x00')[0];
            return { key, value };
        });
    }
}

class VC {
    hasTables() {
        return true;
    }

    parseTables(stream) {
        return _parseTables(stream);
    }

    parseTKeyTDat(stream) {
        const { offset: tkeyOffset, size: tkeySize } = findBlock(stream, 'TKEY');
        const TKey = [];

        for (let i = 0; i < tkeySize / 12; i++) {
            TKey.push({
                offset: stream.getUint32(tkeyOffset + i * 12, true),
                key: new Uint8Array(stream.buffer.slice(tkeyOffset + i * 12 + 4, tkeyOffset + i * 12 + 12)),
            });
        }

        const { offset: tdatOffset, size: tdatSize } = findBlock(stream, 'TDAT');
        const TDat = new Uint8Array(stream.buffer.slice(tdatOffset, tdatOffset + tdatSize));

        return TKey.map(entry => {
            const key = new TextDecoder().decode(entry.key).split('\x00')[0];
            const value = new TextDecoder('utf-16').decode(TDat.slice(entry.offset)).split('\x00')[0];
            return { key, value };
        });
    }
}

class SA {
    hasTables() {
        return true;
    }

    parseTables(stream) {
        return _parseTables(stream);
    }

    parseTKeyTDat(stream) {
        const { offset: tkeyOffset, size: tkeySize } = findBlock(stream, 'TKEY');
        const TKey = [];

        for (let i = 0; i < tkeySize / 8; i++) {
            TKey.push({
                offset: stream.getUint32(tkeyOffset + i * 8, true),
                crc: stream.getUint32(tkeyOffset + i * 8 + 4, true),
            });
        }

        const { offset: tdatOffset, size: tdatSize } = findBlock(stream, 'TDAT');
        const TDat = new Uint8Array(stream.buffer.slice(tdatOffset, tdatOffset + tdatSize));

        return TKey.map(entry => {
            const key = entry.crc.toString(16).padStart(8, '0').toUpperCase();
            let value = new TextDecoder('utf-8').decode(TDat.slice(entry.offset)).split('\x00')[0];
            if (!value) {
                value = new TextDecoder('windows-1252').decode(TDat.slice(entry.offset)).split('\x00')[0];
            }
            return { key, value };
        });
    }
}

class IV {
    hasTables() {
        return true;
    }

    parseTables(stream) {
        return _parseTables(stream);
    }

    parseTKeyTDat(stream) {
        const { offset: tkeyOffset, size: tkeySize } = findBlock(stream, 'TKEY');
        const TKey = [];

        for (let i = 0; i < tkeySize / 8; i++) {
            TKey.push({
                offset: stream.getUint32(tkeyOffset + i * 8, true),
                crc: stream.getUint32(tkeyOffset + i * 8 + 4, true),
            });
        }

        const { offset: tdatOffset, size: tdatSize } = findBlock(stream, 'TDAT');
        const TDat = new Uint8Array(stream.buffer.slice(tdatOffset, tdatOffset + tdatSize));

        return TKey.map(entry => {
            const key = entry.crc.toString(16).padStart(8, '0').toUpperCase();
            let value = '';
            let offset = entry.offset;

            while (true) {
                const unicodeChar = stream.getUint16(offset, true);
                offset += 2;
                if (unicodeChar !== 0) {
                    value += String.fromCharCode(unicodeChar);
                } else {
                    break;
                }
            }

            return { key, value };
        });
    }
}

function findBlock(stream, block) {
    let offset = 0;
    const blockLength = 8; // Block header length

    while (offset < stream.byteLength) {
        const currentBlock = new TextDecoder().decode(new Uint8Array(stream.buffer.slice(offset, offset + 4)));
        if (currentBlock === block) {
            const size = stream.getUint32(offset + 4, true);
            return { offset: offset + blockLength, size };
        }
        offset += 1;
    }

    throw new Error(`Block ${block} not found`);
}

function _parseTables(stream) {
    const { offset, size } = findBlock(stream, 'TABL');
    const Tables = [];

    for (let i = 0; i < size / 12; i++) {
        const rawName = new TextDecoder().decode(new Uint8Array(stream.buffer.slice(offset + i * 12, offset + i * 12 + 8))).split('\x00')[0];
        const tableOffset = stream.getUint32(offset + i * 12 + 8, true);
        Tables.push({ rawName, offset: tableOffset });
    }

    return Tables;
}

function convertUsingTable() {
    alert('码表转换功能待实现');
}

function saveGeneratedTxt() {
    const tableContent = getTableContent();
    if (!tableContent) {
        alert('请先选择并解析GXT文件！');
        return;
    }
    const blob = new Blob([tableContent], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'gxt_content.txt';
    link.click();
}

function clearTable() {
    document.querySelector('#outputTable tbody').innerHTML = '';
}

function displayGxtContentInTable(texts) {
    const tbody = document.querySelector('#outputTable tbody');
    tbody.innerHTML = ''; // 清空表格
    for (const { key, value } of texts) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${key}</td><td>${value}</td>`;
        tbody.appendChild(tr);
    }
}

function getTableContent() {
    const rows = document.querySelectorAll('#outputTable tbody tr');
    let content = '';
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length == 2) {
            content += `${cells[0].innerText}=${cells[1].innerText}\n`;
        } else {
            content += `${cells[0].innerText}\n`;
        }
    });
    return content;
}
