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

    // Virtual Scroller setup
    const tableBody = document.getElementById('tableBody');
    const data = []; // This should be filled with the actual data to display
    for (let i = 0; i < 100000; i++) {
//        data.push({ key: `key${i}`, value: `value${i}` });
        data.push({{i}});
    }

    const renderRow = (index) => {
        const row = document.createElement('tr');
        const keyCell = document.createElement('td');
        const valueCell = document.createElement('td');
        keyCell.textContent = data[index].key;
        valueCell.textContent = data[index].value;
        row.appendChild(keyCell);
        row.appendChild(valueCell);
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
        }

        updateVisibleRows() {
            this.container.innerHTML = '';
            this.container.appendChild(this.placeholder);
            for (let i = this.startIndex; i < this.endIndex; i++) {
                const row = this.renderRow(i);
                row.style.position = 'absolute';
//                row.style.top = `${i * this.rowHeight}px`;
                row.style.top = `${i * this.rowHeight}px`;
                this.container.appendChild(row);
            }
        }

        attachScrollListener() {
            this.container.addEventListener('scroll', () => {
                const scrollTop = this.container.scrollTop;
                this.startIndex = Math.floor(scrollTop / this.rowHeight);
                this.endIndex = Math.min(this.startIndex + this.visibleRows, this.totalRows);
                this.updateVisibleRows();
            });
        }
    }

    new VirtualTableScroller({
        container: tableBody,
        height: 500,
        rowHeight: 30,
        totalRows: data.length,
        renderRow
    });
});
