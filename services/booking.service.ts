import BookingModel, { IBooking } from "../models/booking.model";

export const createBooking = async (
  bookingData: IBooking
): Promise<IBooking> => {
  const createdBooking = await BookingModel.create(bookingData);
  return createdBooking;
};

export const deleteBookingById = async (
  bookingId: string
): Promise<IBooking | null> => {
  const deletedBooking = await BookingModel.findByIdAndDelete(bookingId);
  return deletedBooking;
};
