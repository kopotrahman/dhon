import React, { useState, useEffect } from 'react';
import { bookingAPI, carAPI } from '../../utils/api';
import './Booking.css';

const BookingCalendar = ({ carId, onBookingSelect, onCreateBooking }) => {
  const [calendar, setCalendar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableSlots, setAvailableSlots] = useState(null);
  const [rateType, setRateType] = useState('daily');

  useEffect(() => {
    loadCalendar();
  }, [carId, currentMonth, currentYear]);

  const loadCalendar = async () => {
    try {
      setLoading(true);
      const response = await bookingAPI.getCarCalendar(carId, currentMonth, currentYear);
      setCalendar(response.data);
    } catch (error) {
      console.error('Error loading calendar:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSlots = async (date) => {
    try {
      const response = await bookingAPI.getAvailableSlots(carId, date);
      setAvailableSlots(response.data);
    } catch (error) {
      console.error('Error loading slots:', error);
    }
  };

  const handleDateClick = (day) => {
    if (day.isBooked && rateType === 'daily') return;
    
    setSelectedDate(day);
    if (rateType === 'hourly') {
      loadAvailableSlots(day.date);
    }
  };

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const getMonthName = (month) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1];
  };

  const getDayName = (dayOfWeek) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[dayOfWeek];
  };

  if (loading && !calendar) {
    return <div className="loading">Loading calendar...</div>;
  }

  return (
    <div className="booking-calendar">
      <div className="calendar-header">
        <div className="calendar-title">
          <h2>📅 {calendar?.car?.make} {calendar?.car?.model}</h2>
          <div className="rate-info">
            <span>💰 ${calendar?.car?.rates?.hourly}/hr</span>
            <span>💰 ${calendar?.car?.rates?.daily}/day</span>
          </div>
        </div>
        
        <div className="rate-toggle">
          <button 
            className={`toggle-btn ${rateType === 'hourly' ? 'active' : ''}`}
            onClick={() => setRateType('hourly')}
          >
            ⏰ Hourly
          </button>
          <button 
            className={`toggle-btn ${rateType === 'daily' ? 'active' : ''}`}
            onClick={() => setRateType('daily')}
          >
            📆 Daily
          </button>
        </div>
      </div>

      <div className="calendar-navigation">
        <button onClick={handlePrevMonth}>← Previous</button>
        <h3>{getMonthName(currentMonth)} {currentYear}</h3>
        <button onClick={handleNextMonth}>Next →</button>
      </div>

      <div className="calendar-grid">
        <div className="calendar-weekdays">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="weekday">{day}</div>
          ))}
        </div>

        <div className="calendar-days">
          {/* Empty cells for offset */}
          {calendar?.calendar && calendar.calendar[0] && 
            [...Array(calendar.calendar[0].dayOfWeek)].map((_, i) => (
              <div key={`empty-${i}`} className="calendar-day empty"></div>
            ))
          }
          
          {calendar?.calendar?.map((day) => {
            const isToday = new Date(day.date).toDateString() === new Date().toDateString();
            const isPast = new Date(day.date) < new Date().setHours(0, 0, 0, 0);
            const isSelected = selectedDate?.date === day.date;
            
            return (
              <div
                key={day.date}
                className={`calendar-day 
                  ${day.isBooked ? 'booked' : 'available'}
                  ${isToday ? 'today' : ''}
                  ${isPast ? 'past' : ''}
                  ${isSelected ? 'selected' : ''}
                `}
                onClick={() => !isPast && handleDateClick(day)}
              >
                <span className="day-number">{new Date(day.date).getDate()}</span>
                {day.isBooked && (
                  <span className="booked-indicator">Booked</span>
                )}
                {!day.isBooked && !isPast && (
                  <span className="rate-preview">
                    ${rateType === 'hourly' ? day.rates.hourly : day.rates.daily}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="calendar-legend">
        <div className="legend-item">
          <span className="legend-color available"></span>
          <span>Available</span>
        </div>
        <div className="legend-item">
          <span className="legend-color booked"></span>
          <span>Booked</span>
        </div>
        <div className="legend-item">
          <span className="legend-color today"></span>
          <span>Today</span>
        </div>
      </div>

      {/* Time Slots for Hourly Booking */}
      {rateType === 'hourly' && selectedDate && availableSlots && (
        <div className="time-slots-section">
          <h3>Available Time Slots for {new Date(selectedDate.date).toLocaleDateString()}</h3>
          <div className="time-slots-grid">
            {availableSlots.slots?.map((slot) => (
              <button
                key={slot.hour}
                className={`time-slot ${slot.available ? 'available' : 'unavailable'}`}
                disabled={!slot.available}
              >
                {slot.time}
              </button>
            ))}
          </div>
          <p className="slots-summary">
            {availableSlots.availableHours} hours available
          </p>
        </div>
      )}

      {selectedDate && !selectedDate.isBooked && (
        <div className="booking-action">
          <button 
            className="btn btn-primary btn-lg"
            onClick={() => onCreateBooking(selectedDate, rateType)}
          >
            Book for {new Date(selectedDate.date).toLocaleDateString()}
          </button>
        </div>
      )}
    </div>
  );
};

export default BookingCalendar;
