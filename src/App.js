// Import necessary libraries
import React, { useState, useEffect } from 'react';
import 'tailwindcss/tailwind.css';

const TimeTracker = () => {
  const [inputData, setInputData] = useState('');
  const [processedData, setProcessedData] = useState([]);

  console.log('[Component] TimeTracker initialized');

  // Helper function to parse DD/MM/YYYY HH:mm:ss to ISO format
  const parseDate = (logDate, time) => {
    const [date] = logDate.split(' ');
    const [day, month, year] = date.split('/');
    if (!day || !month || !year || !time) return null;
    return `${year}-${month}-${day}T${time}`;
  };

  // Function to process the raw input data
  const processInput = () => {
    const rows = inputData.trim().split('\n').map(row => row.split(/\s+/));
    const isHeader = rows[0][0]?.toLowerCase() === 'emp_nmbr';
    const dataRows = isHeader ? rows.slice(1) : rows;

    const data = dataRows
      .map(([emp, logDate, time, deviceId]) => {
        const parsedDate = parseDate(logDate, time);
        if (!parsedDate || isNaN(new Date(parsedDate).getTime())) return null;
        return { emp, logDate: parsedDate, time, deviceId };
      })
      .filter(entry => entry !== null);

    const groupedByDate = data.reduce((acc, entry) => {
      const date = entry.logDate.split('T')[0];
      acc[date] = acc[date] || [];
      acc[date].push(entry);
      return acc;
    }, {});

    const calculatedData = Object.keys(groupedByDate).map(date => {
      const entries = groupedByDate[date];
      if (entries.length < 2) {
        return { date, totalHours: 'Invalid', realizedTotalHours: 'Invalid' };
      }

      const times = entries.map(entry => new Date(entry.logDate));
      const earliestTime = new Date(Math.min(...times.map(t => t.getTime())));
      const latestTime = new Date(Math.max(...times.map(t => t.getTime())));

      const realizedEarliestTime = new Date(
        Math.max(
          new Date(`${date}T08:00:00`).getTime(),
          earliestTime.getTime()
        )
      );
      const realizedLatestTime = new Date(
        Math.min(
          new Date(`${date}T17:30:00`).getTime(),
          latestTime.getTime()
        )
      );

      if (earliestTime >= latestTime) {
        return { date, totalHours: 'Invalid', realizedTotalHours: 'Invalid' };
      }

      // Calculate total hours
      const totalDiff = (latestTime - earliestTime) / 1000; // Total time in seconds
      const totalHours = `${Math.floor(totalDiff / 3600)}:${Math.floor(
        (totalDiff % 3600) / 60
      )
        .toString()
        .padStart(2, '0')}`;

      // Calculate realized total hours
      if (realizedEarliestTime >= realizedLatestTime) {
        return { date, totalHours, realizedTotalHours: 'Invalid' };
      }
      const realizedDiff = (realizedLatestTime - realizedEarliestTime) / 1000; // Realized time in seconds
      const realizedTotalHours = `${Math.floor(realizedDiff / 3600)}:${Math.floor(
        (realizedDiff % 3600) / 60
      )
        .toString()
        .padStart(2, '0')}`;

      return { date, totalHours, realizedTotalHours };
    });

    setProcessedData(calculatedData);
  };

  // Cache data in browser
  useEffect(() => {
    const cachedData = localStorage.getItem('timeTrackerData');
    if (cachedData) setInputData(cachedData);
  }, []);

  useEffect(() => {
    localStorage.setItem('timeTrackerData', inputData);
  }, [inputData]);

  // Render the component
  return (
    <div className="p-6 bg-gradient-to-b from-gray-50 to-gray-200 text-gray-900 min-h-screen">
      <h1 className="text-4xl font-extrabold mb-4 text-center font-montserrat tracking-wide">Time Tracker</h1>
      <textarea
        value={inputData}
        onChange={e => setInputData(e.target.value)}
        placeholder="Paste your data here"
        className="w-full p-4 border rounded mb-4 text-gray-700 resize-none overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-400"
        rows={Math.min(inputData.split('\n').length, 10)}
        style={{ minHeight: '80px', maxHeight: '400px' }}
      ></textarea>
      <button
        onClick={processInput}
        className="bg-blue-500 text-white px-6 py-3 rounded-lg shadow hover:shadow-lg transform hover:scale-105 transition-all focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Process Data
      </button>

      <table className="table-auto w-full mt-6 bg-white shadow rounded-lg text-gray-800">
        <thead>
          <tr className="bg-blue-100 text-left">
            <th className="px-6 py-4">Date</th>
            <th className="px-6 py-4">Total Hours</th>
            <th className="px-6 py-4">Realized Total Hours (08:00 - 17:30)</th>
          </tr>
        </thead>
        <tbody>
          {processedData.map((entry, index) => (
            <tr key={index} className="border-t hover:bg-blue-50">
              <td className="px-6 py-4">{entry.date}</td>
              <td className="px-6 py-4">{entry.totalHours}</td>
              <td className="px-6 py-4">{entry.realizedTotalHours}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TimeTracker;
