import {Banknote,Bike,BriefcaseBusiness,Building2,Car,Cloud,Coins,CreditCard,Gamepad2,Gift,GraduationCap,HandCoins,HeartPulse,Home,Landmark,PiggyBank,Plane,ReceiptText,RefreshCcw,ShoppingBag,Smartphone,Target,Utensils,WalletCards,Wrench} from "lucide-react";
import type {LucideIcon} from "lucide-react";
import type {TrackerAccountType,TrackerEntryType} from "@/lib/money/types";

const categoryIcons:[RegExp,LucideIcon][]=[
  [/client|salary|income|payment|sales/i,HandCoins],
  [/food|drink|restaurant/i,Utensils],
  [/shop|purchase/i,ShoppingBag],
  [/house|rent|home/i,Home],
  [/transport|bus|train/i,Bike],
  [/vehicle|car/i,Car],
  [/health|medical/i,HeartPulse],
  [/software|tool|internet|communication/i,Cloud],
  [/education|course/i,GraduationCap],
  [/travel/i,Plane],
  [/entertainment|game/i,Gamepad2],
  [/gift/i,Gift],
  [/goal/i,Target],
  [/office|business/i,BriefcaseBusiness],
];

export function accountIcon(type:TrackerAccountType):LucideIcon{
  if(type==="cash")return Banknote;
  if(["bkash","nagad","rocket"].includes(type))return Smartphone;
  if(type==="credit_card")return CreditCard;
  if(type==="savings")return PiggyBank;
  if(type==="loan")return ReceiptText;
  if(type==="investment")return Coins;
  if(type==="bank"||type==="online_bank")return Landmark;
  return WalletCards;
}

export function categoryIcon(name:string):LucideIcon{return categoryIcons.find(([pattern])=>pattern.test(name))?.[1]??Wrench;}

export function entryIcon(type:TrackerEntryType):LucideIcon{
  if(type==="income")return HandCoins;
  if(type==="transfer")return RefreshCcw;
  return ReceiptText;
}

export const moneyNavIcons={overview:WalletCards,accounts:Building2,transactions:ReceiptText,categories:Coins,reports:Target,planning:PiggyBank};
