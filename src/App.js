import React, { useState, useEffect, useMemo } from 'react';
import 'tailwindcss/tailwind.css';

const TimeTracker = () => {
  const [inputData, setInputData] = useState('');
  const [processedData, setProcessedData] = useState([]);
  const [punchInTime, setPunchInTime] = useState('');
  const [dailyHours, setDailyHours] = useState('8:30:00');

  const parseDate = (logDate, time) => {
    const [date] = logDate.split(' ');
    const [day, month, year] = date.split('/');
    if (!day || !month || !year || !time) return null;
    return `${year}-${month}-${day}T${time}`;
  };

  const processInput = () => {
    if (!inputData.trim()) {
      alert('Please enter some data before processing!');
      return;
    }

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
      const hours = Math.floor(totalDiff / 3600);
      const remainingSeconds = totalDiff % 3600;
      const minutes = Math.floor(remainingSeconds / 60);
      const seconds = Math.floor(remainingSeconds % 60);
      const totalHours = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

      if (realizedEarliestTime >= realizedLatestTime) {
        return { date, totalHours, realizedTotalHours: 'Invalid' };
      }
      
      const realizedDiff = (realizedLatestTime - realizedEarliestTime) / 1000;
      const realizedHours = Math.floor(realizedDiff / 3600);
      const realizedRemaining = realizedDiff % 3600;
      const realizedMinutes = Math.floor(realizedRemaining / 60);
      const realizedSeconds = Math.floor(realizedRemaining % 60);
      const realizedTotalHours = `${realizedHours}:${realizedMinutes.toString().padStart(2, '0')}:${realizedSeconds.toString().padStart(2, '0')}`;

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
    let totalSeconds = 0;
    processedData.forEach(entry => {
      if (entry.totalHours === 'Invalid') return;
      const [h, m, s] = entry.totalHours.split(':').map(Number);
      totalSeconds += h * 3600 + m * 60 + (s || 0);
    });
    
    const hours = Math.floor(totalSeconds / 3600);
    const remaining = totalSeconds % 3600;
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [processedData]);

  const totalRealizedHours = useMemo(() => {
    let totalSeconds = 0;
    processedData.forEach(entry => {
      if (entry.realizedTotalHours === 'Invalid') return;
      const [h, m, s] = entry.realizedTotalHours.split(':').map(Number);
      totalSeconds += h * 3600 + m * 60 + (s || 0);
    });
    
    const hours = Math.floor(totalSeconds / 3600);
    const remaining = totalSeconds % 3600;
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [processedData]);

  const calculateDifference = (total, realized) => {
    if (total === 'Invalid' || realized === 'Invalid') return 'N/A';
    
    try {
      const [tH, tM, tS] = total.split(':').map(Number);
      const [rH, rM, rS] = realized.split(':').map(Number);
      
      const totalSeconds = tH * 3600 + tM * 60 + (tS || 0);
      const realizedSeconds = rH * 3600 + rM * 60 + (rS || 0);
      const difference = totalSeconds - realizedSeconds;
      
      if (difference < 0) return 'N/A';
      
      const hours = Math.floor(difference / 3600);
      const remaining = difference % 3600;
      const minutes = Math.floor(remaining / 60);
      const seconds = remaining % 60;
      
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } catch {
      return 'N/A';
    }
  };
  const handleTimeInput = (value, setter) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Parse hours, minutes, seconds
    let hours = digits.slice(0, 2);
    let minutes = digits.slice(2, 4);
    let seconds = digits.slice(4, 6);

    // Validate and format
    hours = hours.length ? Math.min(23, parseInt(hours, 10)).toString().padStart(2, '0') : '';
    minutes = minutes.length ? Math.min(59, parseInt(minutes, 10)).toString().padStart(2, '0') : '';
    seconds = seconds.length ? Math.min(59, parseInt(seconds, 10)).toString().padStart(2, '0') : '';

    // Build formatted time string
    let formatted = hours;
    if (minutes) formatted += `:${minutes}`;
    if (seconds) formatted += `:${seconds}`;
    
    setter(formatted);
  };
  
  const calculateEstimatedPunchOut = () => {
    if (!punchInTime) return 'N/A';
    
    try {
      const [startH, startM] = punchInTime.split(':').map(Number);
      const [reqH, reqM, reqS] = dailyHours.split(':').map(Number);
      
      const totalStart = startH * 3600 + startM * 60;
      const totalRequired = (reqH || 0) * 3600 + (reqM || 0) * 60 + (reqS || 0);
      const totalEnd = totalStart + totalRequired;
      
      const hours = Math.floor(totalEnd / 3600) % 24;
      const remaining = totalEnd % 3600;
      const minutes = Math.floor(remaining / 60);
      const seconds = remaining % 60;
      
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    } catch {
      return 'Invalid';
    }
  };

  return (
    <div className="p-4 sm:p-6 min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative">
      <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmZmIi8+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2Q4ZDhkOCIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+')]"></div>
      
      <div className="relative z-10">
        <h1 className="text-2xl sm:text-4xl font-bold mb-6 text-center font-montserrat text-gray-800 flex flex-col sm:flex-row items-center justify-center gap-2">
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Time Tracker
          </span>
          <img
            src={`${process.env.PUBLIC_URL}/hourglass-watch-svgrepo-com.svg`}
            alt="Hourglass"
            className="w-8 h-8 animate-pulse"
          />
        </h1>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Punch In Time
              </label>
              <input
                type="text"
                value={punchInTime}
                onChange={(e) => handleTimeInput(e.target.value, setPunchInTime)}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                placeholder="HH:MM:SS"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Daily Required Hours
              </label>
              <input
                type="text"
                value={dailyHours}
                onChange={(e) => setDailyHours(e.target.value)}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                placeholder="HH:mm:ss"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Estimated Punch Out
              </label>
              <div className="w-full p-2 border rounded-lg bg-gray-50">
                <span className="font-semibold text-blue-600">
                  {calculateEstimatedPunchOut()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20 mb-8">
          <textarea
            value={inputData}
            onChange={e => setInputData(e.target.value)}
            placeholder="Paste your data here..."
            className="w-full p-3 sm:p-4 border border-gray-200 rounded-lg mb-4 text-sm sm:text-base text-gray-700 resize-none overflow-y-auto focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/50"
            rows={6}
            style={{ minHeight: '150px', maxHeight: '300px' }}
          ></textarea>
          
          <button
            onClick={processInput}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-sm sm:text-base text-white px-4 py-3 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 font-semibold"
          >
            Process Data
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 my-6">
          {[
            { title: "Total Hours", value: totalHours, color: "text-blue-600" },
            { title: "Realized Hours", value: totalRealizedHours, color: "text-green-600" },
            { title: "Total Difference", value: calculateDifference(totalHours,totalRealizedHours), color: "text-red-600" },
            { title: "Requirement Hours", value: calculateDifference("42:00:00",totalRealizedHours), color: "text-yellow-600" }
          ].map((card, index) => (
            <div key={index} className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-white/20">
              <h3 className="text-xs sm:text-sm font-medium mb-1 text-gray-600">{card.title}</h3>
              <p className={`text-xl sm:text-2xl font-bold ${card.color}`}>
                {card.value}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">Date</th>
                  <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">Total Hours</th>
                  <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">Realized Hours</th>
                  <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">Difference</th>
                </tr>
              </thead>
              <tbody>
                {processedData.map((entry, index) => (
                  <tr key={index} className="border-t border-gray-100 hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-xs sm:text-sm">{entry.date}</td>
                    <td className="px-4 py-3 text-xs sm:text-sm">{entry.totalHours}</td>
                    <td className="px-4 py-3 text-xs sm:text-sm">{entry.realizedTotalHours}</td>
                    <td className="px-4 py-3 text-xs sm:text-sm font-medium text-red-600">
                      {calculateDifference(entry.totalHours, entry.realizedTotalHours)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-center text-gray-600 mt-6">
          Made by{' '}
          <a
            href="https://www.github.com/ParthJohri"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700 font-semibold"
          >
            Parth
          </a>
        </p>
      </div>
    </div>
  );
};

export default TimeTracker;