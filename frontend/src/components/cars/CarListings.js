import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import './CarSales.css';

const CarListings = () => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listingType, setListingType] = useState('sale');
  const [filters, setFilters] = useState({
    make: '',
    model: '',
    minYear: '',
    maxYear: '',
    minPrice: '',
    maxPrice: '',
    transmission: '',
    fuelType: '',
    bodyType: ''
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });
  const [popularMakes, setPopularMakes] = useState([]);

  useEffect(() => {
    fetchCars();
    fetchPopularMakes();
  }, [listingType, filters, pagination.current]);

  const fetchCars = async () => {
    try {
      setLoading(true);
      const endpoint = listingType === 'sale' ? '/car-sales/search/sale' : '/car-sales/search/rent';
      
      const params = new URLSearchParams({
        page: pagination.current,
        limit: 12,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
      });

      const response = await api.get(`${endpoint}?${params}`);
      setCars(response.data.cars);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching cars:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPopularMakes = async () => {
    try {
      const response = await api.get('/car-sales/popular-makes');
      setPopularMakes(response.data.makes);
    } catch (error) {
      console.error('Error fetching popular makes:', error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      make: '',
      model: '',
      minYear: '',
      maxYear: '',
      minPrice: '',
      maxPrice: '',
      transmission: '',
      fuelType: '',
      bodyType: ''
    });
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

  return (
    <div className="car-listings-container">
      <div className="car-listings-header">
        <h1>Find Your Perfect Car</h1>
        <p>Browse cars for sale and rent</p>

        <div className="listing-type-toggle">
          <button
            className={listingType === 'sale' ? 'active' : ''}
            onClick={() => setListingType('sale')}
          >
            Cars for Sale
          </button>
          <button
            className={listingType === 'rent' ? 'active' : ''}
            onClick={() => setListingType('rent')}
          >
            Cars for Rent
          </button>
        </div>
      </div>

      <div className="car-listings-content">
        {/* Filters Sidebar */}
        <div className="filters-sidebar">
          <div className="filters-header">
            <h3>Filters</h3>
            <button className="clear-filters" onClick={clearFilters}>
              Clear All
            </button>
          </div>

          <div className="filter-group">
            <label>Make</label>
            <select name="make" value={filters.make} onChange={handleFilterChange}>
              <option value="">All Makes</option>
              {popularMakes.map(make => (
                <option key={make._id} value={make._id}>{make._id}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Model</label>
            <input
              type="text"
              name="model"
              placeholder="Enter model"
              value={filters.model}
              onChange={handleFilterChange}
            />
          </div>

          <div className="filter-group">
            <label>Year</label>
            <div className="range-inputs">
              <select name="minYear" value={filters.minYear} onChange={handleFilterChange}>
                <option value="">Min</option>
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <span>to</span>
              <select name="maxYear" value={filters.maxYear} onChange={handleFilterChange}>
                <option value="">Max</option>
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="filter-group">
            <label>Price Range</label>
            <div className="range-inputs">
              <input
                type="number"
                name="minPrice"
                placeholder="Min"
                value={filters.minPrice}
                onChange={handleFilterChange}
              />
              <span>to</span>
              <input
                type="number"
                name="maxPrice"
                placeholder="Max"
                value={filters.maxPrice}
                onChange={handleFilterChange}
              />
            </div>
          </div>

          <div className="filter-group">
            <label>Transmission</label>
            <select name="transmission" value={filters.transmission} onChange={handleFilterChange}>
              <option value="">All</option>
              <option value="automatic">Automatic</option>
              <option value="manual">Manual</option>
              <option value="cvt">CVT</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Fuel Type</label>
            <select name="fuelType" value={filters.fuelType} onChange={handleFilterChange}>
              <option value="">All</option>
              <option value="petrol">Petrol</option>
              <option value="diesel">Diesel</option>
              <option value="electric">Electric</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Body Type</label>
            <select name="bodyType" value={filters.bodyType} onChange={handleFilterChange}>
              <option value="">All</option>
              <option value="sedan">Sedan</option>
              <option value="suv">SUV</option>
              <option value="hatchback">Hatchback</option>
              <option value="coupe">Coupe</option>
              <option value="truck">Truck</option>
              <option value="van">Van</option>
              <option value="convertible">Convertible</option>
            </select>
          </div>
        </div>

        {/* Car Grid */}
        <div className="cars-main">
          <div className="results-header">
            <span>{pagination.total} cars found</span>
            <select className="sort-select">
              <option value="createdAt">Newest First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="year-desc">Year: Newest</option>
              <option value="mileage-asc">Mileage: Lowest</option>
            </select>
          </div>

          {loading ? (
            <div className="loading">Loading cars...</div>
          ) : (
            <>
              <div className="cars-grid">
                {cars.map(car => (
                  <Link to={`/cars/${car._id}`} key={car._id} className="car-card">
                    <div className="car-image">
                      {car.images && car.images.length > 0 ? (
                        <img src={car.images[0].url} alt={`${car.make} ${car.model}`} />
                      ) : (
                        <div className="no-image">No Image</div>
                      )}
                      {car.isFeatured && <span className="featured-badge">Featured</span>}
                      {listingType === 'sale' && car.condition === 'new' && (
                        <span className="new-badge">New</span>
                      )}
                    </div>

                    <div className="car-info">
                      <h3 className="car-title">{car.year} {car.make} {car.model}</h3>
                      
                      <div className="car-specs">
                        {car.mileage && (
                          <span>{car.mileage.toLocaleString()} mi</span>
                        )}
                        {car.transmission && (
                          <span>{car.transmission}</span>
                        )}
                        {car.fuelType && (
                          <span>{car.fuelType}</span>
                        )}
                      </div>

                      <div className="car-price">
                        {listingType === 'sale' ? (
                          <span className="price">${car.price?.toLocaleString()}</span>
                        ) : (
                          <span className="price">${car.rentalPricing?.daily}/day</span>
                        )}
                      </div>

                      <div className="car-location">
                        📍 {car.location?.city || 'Location not specified'}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {cars.length === 0 && (
                <div className="no-cars">
                  No cars found matching your criteria.
                </div>
              )}

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="pagination">
                  <button
                    disabled={pagination.current === 1}
                    onClick={() => setPagination(prev => ({ ...prev, current: prev.current - 1 }))}
                  >
                    Previous
                  </button>
                  
                  <span>Page {pagination.current} of {pagination.pages}</span>
                  
                  <button
                    disabled={pagination.current === pagination.pages}
                    onClick={() => setPagination(prev => ({ ...prev, current: prev.current + 1 }))}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CarListings;
