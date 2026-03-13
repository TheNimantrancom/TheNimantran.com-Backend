import  {
  
  Document,

  Types,
} from "mongoose"
export interface IAddressInfo {
  name: string
  phone: string
  alternatePhone?: string | null
  state: string
  city: string
  roadAreaColony: string
  pincode: string
  lat:number
  lang:number
  landmark?: string
  typeOfAddress: "home" | "work" | "other"
}
export interface IAddress extends Document {
  userId: Types.ObjectId
  addresses: IAddressInfo[]
  defaultAddress?: IAddressInfo
  createdAt: Date
  updatedAt: Date
}