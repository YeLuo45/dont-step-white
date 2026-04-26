import { useState, useEffect, useCallback, useRef } from 'react'

export function useStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  const latestValueRef = useRef(storedValue)
  useEffect(() => { latestValueRef.current = storedValue }, [storedValue])

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(latestValueRef.current) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error)
    }
  }, [key])

  return [storedValue, setValue]
}
