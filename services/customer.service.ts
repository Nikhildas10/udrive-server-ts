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
  await customerModel.findByIdAndUpdate(customerId, { isDeleted: true }, { new: true });
};

export const getAllCustomers = async (): Promise<ICustomer[]> => {
  const customers = await customerModel.find({isDeleted:false});
  return customers;
};

export const getSingleCustomer=async(customerId:string):Promise<ICustomer>=>{
  const customers = await customerModel.findOne({ _id: customerId, isDeleted: false });
  return customers;
}