document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("aboutModal");
    const span = document.getElementsByClassName("close")[0];

    span.onclick = () => {
        modal.style.display = "none";
    };

    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    };

    document.querySelectorAll('.btn').forEach(button => {
        button.addEventListener('click', () => {
            button.classList.add('animate__animated', 'animate__pulse');
            setTimeout(() => {
                button.classList.remove('animate__animated', 'animate__pulse');
            }, 1000);
        });
    });

    const tableBody = document.getElementById('tableBody');
    const data = [];
    for (let i = 0; i < 100000; i++) {
        data.push({ key: `键值${i}`, value: `内容${i}` });
    }

    // 修改的渲染行函数，只显示行号，不显示具体内容
const renderRow = (index) => {
    const row = document.createElement('tr');
    const keyCell = document.createElement('td');
    keyCell.textContent = `行号 ${index + 1}`;
    row.appendChild(keyCell);
    return row;
};

class VirtualTableScroller {
    constructor({ container, height, rowHeight, totalRows, renderRow }) {
        this.container = container;
        this.height = height;
        this.rowHeight = rowHeight;
        this.totalRows = totalRows;
        this.renderRow = renderRow;
        this.visibleRows = Math.ceil(this.height / this.rowHeight);
        this.startIndex = 0;
        this.endIndex = this.visibleRows;

        this.createPlaceholder();
        this.updateVisibleRows();
        this.attachScrollListener();
    }

    createPlaceholder() {
        this.placeholder = document.createElement('div');
        this.placeholder.style.height = `${this.totalRows * this.rowHeight}px`;
        this.container.appendChild(this.placeholder);
        this.container.style.position = 'relative';
        this.container.style.height = `${this.height}px`;
        this.container.style.overflowY = 'auto';
    }

    updateVisibleRows() {
        const fragment = document.createDocumentFragment();
        for (let i = this.startIndex; i < this.endIndex; i++) {
            const row = this.renderRow(i);
            row.style.position = 'absolute';
            row.style.top = `${i * this.rowHeight}px`;
            row.style.width = '100%';
            fragment.appendChild(row);
        }
        this.container.innerHTML = '';
        this.container.appendChild(this.placeholder);
        this.container.appendChild(fragment);
    }

    attachScrollListener() {
        this.container.addEventListener('scroll', () => {
            const scrollTop = this.container.scrollTop;
            const newStartIndex = Math.floor(scrollTop / this.rowHeight);
            const newEndIndex = Math.min(newStartIndex + this.visibleRows, this.totalRows);

            if (newStartIndex !== this.startIndex || newEndIndex !== this.endIndex) {
                this.startIndex = newStartIndex;
                this.endIndex = newEndIndex;
                this.updateVisibleRows();
            }
        });
    }
}

const tableBody = document.getElementById('tableBody');
const data = [];
for (let i = 0; i < 100000; i++) {
    data.push({ key: `键值${i}`, value: `内容${i}` });
}

new VirtualTableScroller({
    container: tableBody,
    height: 500,  // 确保这里高度设置正确
    rowHeight: 30,  // 确保每行的高度设置合适
    totalRows: data.length,
    renderRow
});
