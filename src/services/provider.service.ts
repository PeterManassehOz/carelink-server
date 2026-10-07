import {
  isObjectIdOrHexString,
} from "mongoose";

import { Provider } from "../models/Provider.js";

export interface GetProvidersFilters {
  search?: string;
  specialty?: string;
  location?: string;
}

function serializeProvider(provider: any) {
  return {
    id: provider._id.toString(),
    name: provider.name,
    specialty: provider.specialty,
    description: provider.description,
    location: provider.location,
    phone: provider.phone,
    email: provider.email,
    image: provider.image,
    availability: provider.availability,
    createdAt: provider.createdAt,
    updatedAt: provider.updatedAt,
  };
}

export async function getProviders(
  filters: GetProvidersFilters = {},
) {
  const {
    search,
    specialty,
    location,
  } = filters;

  const query: Record<string, unknown> = {};

  if (search) {
    query.$or = [
      {
        name: {
          $regex: search,
          $options: "i",
        },
      },
      {
        specialty: {
          $regex: search,
          $options: "i",
        },
      },
    ];
  }

  if (specialty) {
    query.specialty = {
      $regex: specialty,
      $options: "i",
    };
  }

  if (location) {
    query.location = {
      $regex: location,
      $options: "i",
    };
  }

  const providers = await Provider.find(query).sort({
    name: 1,
  });

  return providers.map(serializeProvider);
}

export async function getProviderById(
  providerId: string,
) {
  if (!isObjectIdOrHexString(providerId)) {
    throw new Error("INVALID_PROVIDER_ID");
  }

  const provider = await Provider.findById(providerId);

  if (!provider) {
    throw new Error("PROVIDER_NOT_FOUND");
  }

  return serializeProvider(provider);
}