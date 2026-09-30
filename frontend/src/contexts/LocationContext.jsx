import React, { createContext, useContext, useState } from 'react';

const LocationContext = createContext();

export function LocationProvider({ children }) {
  // Explicitly labeled as a Demo Location. No hidden hardcoding.
  const [location, setLocation] = useState({
    lat: 12.9784,
    lng: 77.6412,
    label: 'Demo Location (Indiranagar, Bengaluru)',
  });

  return (
    <LocationContext.Provider value={{ location, setLocation }}>
      {children}
    </LocationContext.Provider>
  );
}

export const useLocation = () => useContext(LocationContext);