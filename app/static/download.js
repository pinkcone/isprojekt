document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('downloadDataButton').addEventListener('click', function () {
        document.getElementById('formatModal').style.display = 'flex';
    });

    document.getElementById('confirmDownloadButton').addEventListener('click', function () {
        const fileFormat = document.getElementById('fileFormatSelect').value;
        downloadData(fileFormat);
        document.getElementById('formatModal').style.display = 'none';
    });

    document.getElementById('closeModalButton').addEventListener('click', function () {
        document.getElementById('formatModal').style.display = 'none';
    });
});

function downloadData(fileFormat) {
    const startMonth = document.getElementById('startMonthSelect').value;
    const startYear = document.getElementById('startYearSelect').value;
    const endMonth = document.getElementById('endMonthSelect').value;
    const endYear = document.getElementById('endYearSelect').value;
    const dataType1 = document.getElementById('dataTypeSelect').value;
    const dataType2 = document.getElementById('dataTypeSelect2').value;
    const region = selectedRegions.length ? selectedRegions.join(',') : 'POLSKA';

    const url = `/download_data?regions=${region}&start_month=${startMonth}&start_year=${startYear}&end_month=${endMonth}&end_year=${endYear}&data_types=${dataType1}&data_types2=${dataType2}&format=${fileFormat}`;
    window.location.href = url;
}
