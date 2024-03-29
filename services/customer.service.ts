import customerModel, { ICustomer } from "../models/customer.model";


export const updateCustomerById = async (
  customerId: string,
  updatedCustomerData: any
): Promise<ICustomer | null> => {
  const customer = await customerModel.findByIdAndUpdate(
    customerId,
    updatedCustomerData,
    {
      new: true,
    }
  );
  return customer;
};

export const deleteCustomerById = async (customerId: string): Promise<void> => {
  await customerModel.findByIdAndDelete(customerId);
};

export const getAllCustomers = async (): Promise<ICustomer[]> => {
  const customers = await customerModel.find({});
  return customers;
};

export const getSingleCustomer=async(customerId:string):Promise<ICustomer>=>{
  const customers= await customerModel.findById(customerId)
  return customers;
}