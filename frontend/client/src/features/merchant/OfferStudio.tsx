import React from "react";
import { OfferGovernance, OfferGovernanceProps } from "../admin/OfferGovernance";

export interface OfferStudioProps extends OfferGovernanceProps {}

export const OfferStudio: React.FC<OfferStudioProps> = (props) => {
  return <OfferGovernance {...props} role={props.role || "merchant"} />;
};
