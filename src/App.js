import React, { useState, useEffect, useMemo } from 'react';
import 'tailwindcss/tailwind.css';

const TimeTracker = () => {
  const [inputData, setInputData] = useState('');
  const [processedData, setProcessedData] = useState([]);

  const parseDate = (logDate, time) => {
    const [date] = logDate.split(' ');
    const [day, month, year] = date.split('/');
    if (!day || !month || !year || !time) return null;
    return `${year}-${month}-${day}T${time}`;
  };

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

      const totalDiff = (latestTime - earliestTime) / 1000;
      const totalHours = `${Math.floor(totalDiff / 3600)}:${Math.floor(
        (totalDiff % 3600) / 60
      )
        .toString()
        .padStart(2, '0')}`;

      if (realizedEarliestTime >= realizedLatestTime) {
        return { date, totalHours, realizedTotalHours: 'Invalid' };
      }
      
      const realizedDiff = (realizedLatestTime - realizedEarliestTime) / 1000;
      const realizedTotalHours = `${Math.floor(realizedDiff / 3600)}:${Math.floor(
        (realizedDiff % 3600) / 60
      )
        .toString()
        .padStart(2, '0')}`;

      return { date, totalHours, realizedTotalHours };
    });

    setProcessedData(calculatedData);
  };

  useEffect(() => {
    const cachedData = localStorage.getItem('timeTrackerData');
    if (cachedData) setInputData(cachedData);
  }, []);

  useEffect(() => {
    localStorage.setItem('timeTrackerData', inputData);
  }, [inputData]);

  const totalHours = useMemo(() => {
    let totalMinutes = 0;
    processedData.forEach(entry => {
      if (entry.totalHours === 'Invalid') return;
      const [hours, minutes] = entry.totalHours.split(':').map(Number);
      totalMinutes += hours * 60 + minutes;
    });
    return `${Math.floor(totalMinutes / 60)}:${(totalMinutes % 60).toString().padStart(2, '0')}`;
  }, [processedData]);

  const totalRealizedHours = useMemo(() => {
    let totalMinutes = 0;
    processedData.forEach(entry => {
      if (entry.realizedTotalHours === 'Invalid') return;
      const [hours, minutes] = entry.realizedTotalHours.split(':').map(Number);
      totalMinutes += hours * 60 + minutes;
    });
    return `${Math.floor(totalMinutes / 60)}:${(totalMinutes % 60).toString().padStart(2, '0')}`;
  }, [processedData]);

   // Add difference calculation function
   const calculateDifference = (total, realized) => {
    if (total === 'Invalid' || realized === 'Invalid') return 'N/A';
    
    const [totalHours, totalMinutes] = total.split(':').map(Number);
    const [realizedHours, realizedMinutes] = realized.split(':').map(Number);
    
    const totalInMinutes = totalHours * 60 + totalMinutes;
    const realizedInMinutes = realizedHours * 60 + realizedMinutes;
    
    const differenceInMinutes = totalInMinutes - realizedInMinutes;
    
    if (differenceInMinutes < 0) return 'N/A';
    
    const hours = Math.floor(differenceInMinutes / 60);
    const minutes = differenceInMinutes % 60;
    
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };
  
 // Update the return statement with these responsive classes
return (
  <div className="p-4 sm:p-6 bg-gradient-to-b from-gray-50 to-gray-200 text-gray-900 min-h-screen">
    <h1 className="text-2xl sm:text-4xl font-extrabold mb-4 text-center font-montserrat tracking-wide flex flex-col sm:flex-row items-center justify-center gap-2">
      Time Tracker
      <img
        src={`${process.env.PUBLIC_URL}/hourglass-watch-svgrepo-com.svg`}
        alt="Hourglass"
        className="w-6 h-6 sm:w-8 sm:h-8"
      />
    </h1>

    <textarea
      value={inputData}
      onChange={e => setInputData(e.target.value)}
      placeholder="Paste your data here"
      className="w-full p-3 sm:p-4 border rounded mb-4 text-sm sm:text-base text-gray-700 resize-none overflow-y-auto focus:outline-none focus:ring-2 focus:ring-blue-400"
      rows={6} // Fixed rows to ensure scrolling
      style={{ minHeight: '150px', maxHeight: '300px' }}
    ></textarea>
    <button
      onClick={processInput}
      className="w-full bg-blue-500 text-sm sm:text-base text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg shadow hover:shadow-lg transform hover:scale-105 transition-all focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      Process Data
    </button>

    {/* Summary Cards Grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 my-4 sm:my-6">
      {[
        { title: "Total Hours", value: totalHours, color: "text-blue-600" },
        { title: "Realized Hours", value: totalRealizedHours, color: "text-green-600" },
        { title: "Total Difference", value: calculateDifference(totalHours,totalRealizedHours), color: "text-red-600" },
        { title: "Requirement Hours", value: calculateDifference("42:00",totalRealizedHours), color: "text-yellow-600" }
      ].map((card, index) => (
        <div key={index} className="bg-white p-3 sm:p-4 rounded-lg shadow border border-blue-100">
          <h3 className="text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-gray-700">{card.title}</h3>
          <p className={`text-lg sm:text-xl lg:text-2xl font-bold ${card.color}`}>
            {card.value}
          </p>
        </div>
      ))}
    </div>

    {/* Scrollable Table Container */}
    <div className="overflow-x-auto rounded-lg shadow">
      <table className="w-full min-w-[600px] bg-white text-gray-800">
        <thead>
          <tr className="bg-blue-100 text-left">
            <th className="px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm">Date</th>
            <th className="px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm">Total Hours</th>
            <th className="px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm">Realized Hours (08:00 - 17:30)</th>
            <th className="px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm">Difference (Total - Difference)</th>
          </tr>
        </thead>
        <tbody>
          {processedData.map((entry, index) => (
            <tr key={index} className="border-t hover:bg-blue-50">
              <td className="px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm">{entry.date}</td>
              <td className="px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm">{entry.totalHours}</td>
              <td className="px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm">{entry.realizedTotalHours}</td>
              <td className="px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm text-red-600 font-medium">
                {calculateDifference(entry.totalHours, entry.realizedTotalHours)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
};

export default TimeTracker;