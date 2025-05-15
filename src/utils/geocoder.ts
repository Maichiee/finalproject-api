import NodeGeocoder from "node-geocoder"
import type { Options, Geocoder } from "node-geocoder"
import { GEOCODER_CONFIG } from "../config"

// Initialize geocoder with provider
const geocoderOptions: Options = {
  provider: GEOCODER_CONFIG.provider as any,
  apiKey: GEOCODER_CONFIG.apiKey,
  formatter: null,
}

const geocoder: Geocoder = NodeGeocoder(geocoderOptions)

/**
 * Convert address to coordinates (latitude and longitude)
 * @param address Full address string
 * @returns Object containing latitude and longitude
 */
export const getCoordinatesFromAddress = async (
  address: string,
): Promise<{ latitude: number; longitude: number } | null> => {
  try {
    const results = await geocoder.geocode(address)

    if (results && results.length > 0) {
      const { latitude, longitude } = results[0]

      if (latitude !== undefined && longitude !== undefined) {
        return {
          latitude: Number(latitude),
          longitude: Number(longitude),
        }
      }
    }

    console.warn(`Could not geocode address: ${address}`)
    return null
  } catch (error) {
    console.error("Geocoding error:", error)
    return null
  }
}
