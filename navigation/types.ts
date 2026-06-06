export type RootParamList = {
  Calculator: undefined;
  Transactions:
    | {
        source?: "notification";
        transactionId?: string;
      }
    | undefined;
  Insights:
    | {
        source?: "notification";
      }
    | undefined;
  Settings:
    | {
        section?: "notification-reminders";
        source?: "notification";
      }
    | undefined;
  CategoryManagement: undefined;
};
