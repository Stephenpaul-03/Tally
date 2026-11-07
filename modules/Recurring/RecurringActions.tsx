import { getAccountColor, getAccountIconName } from "@/utils/Helpers";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { categoryTone } from "@/theme/sage";
import { tonalButtonSurface } from "@/theme/surfaceTreatment";
import type { ExtendedMD3Theme } from "@/theme/buildPaperTheme";
import { recurringDate } from "./RecurringCard";
import React from "react";
import { FlatList, Pressable, View } from "react-native";
import { Button, useTheme } from "react-native-paper";
import { DesignText as Text } from "@/components/DesignText";
import { AlertModal } from "@/components/alert/AlertModal";
import { AnimatedPaperModal } from "@/components/modal/modal";
import { toast } from "@/components/toast/ToastProvider";
import { ControlsSheet } from "@/modules/Insights/sheets/ControlsSheet";
import { SettingsHeader } from "@/modules/Settings/Components/SettingsHeader";
import { TransactionModal } from "@/modules/Management/Transaction/Components/TransactionModal/Index";
import { TransactionRow } from "@/modules/Management/Transaction/Components/TransactionRow";
import { ledgerMoney } from "@/modules/Main/presentation";
import { useAppDispatch, useAppSelector } from "@/hooks/Redux";
import { confirmRecurringAsync, selectTransactions, selectAccountColors, selectAccountIcons } from "@/modules/Core/Slices/TransactionSlice";
import { setRecurringState, skipRecurring } from "./repository";
import { frequencyLabel, shiftDays, type RecurringTemplate, type RecurringOccurrence } from "./model";
export type RecurringSelection = { template: RecurringTemplate; occurrence?: RecurringOccurrence; quick?: boolean };
export function RecurringActions({ selection,onClose,occurrences }: { selection:RecurringSelection|null; onClose:()=>void; occurrences:RecurringOccurrence[] }) {
 const theme=useTheme<ExtendedMD3Theme>(), c=theme.colors, dispatch=useAppDispatch();
 const ledger=useAppSelector(selectTransactions);
 const accountColors=useAppSelector(selectAccountColors);
 const accountIcons=useAppSelector(selectAccountIcons);
 const held=React.useRef<RecurringSelection|null>(selection);
 if(selection) held.current=selection;
 const template=held.current?.template;
 const chosenOccurrence=held.current?.occurrence;
 const occurrence=occurrences.find(item=>item.templateId===chosenOccurrence?.templateId && item.dueDate===chosenOccurrence?.dueDate)||chosenOccurrence;
 const [quick,setQuick]=React.useState(false), [editing,setEditing]=React.useState(false), [manual,setManual]=React.useState(false), [deleting,setDeleting]=React.useState(false), [busy,setBusy]=React.useState(false);
 React.useEffect(()=>{setQuick(Boolean(selection?.quick));setEditing(false);setManual(false);setDeleting(false);},[selection]);
 const prompt=React.useMemo(()=>template && occurrence ? { template,occurrence } : null,[template,occurrence]);
 if(!template) return null;
 const money=(amount:number)=>ledgerMoney(amount,template.form.currencyCode||"INR",template.form.currencySymbol);
 const pending=occurrence?.status==="pending" && !template.paused;
 const candidates=ledger.filter(transaction=>!transaction.deleted && transaction.type===template.form.type && (transaction.currencyCode||"INR")===(template.form.currencyCode||"INR") && occurrence && transaction.date>=shiftDays(occurrence.dueDate,-5) && transaction.date<=shiftDays(occurrence.dueDate,5) && !occurrences.some(item=>item.transactionId===transaction.id));
 const run=async(task:()=>Promise<unknown>,message:string)=>{
  if(busy) return;
  setBusy(true);
  try{await task();toast.success(message);onClose();}catch(error){toast.error(error instanceof Error?error.message:String(error));}finally{setBusy(false);}
 };
 const closeChild=()=>{setQuick(false);if(selection?.quick)onClose();};
 const [tone,ink]=categoryTone("",theme.dark,template.color);
 const heroBackground=theme.expressive?tone:c.surface;
 const heroText=theme.expressive?ink:c.onSurface;
 const history=occurrences.filter(item=>item.templateId===template.id).slice(0,12);
 const buttonStyle={borderRadius:24,borderColor:c.outlineVariant,flex:1};
 const controlIcon=(name:React.ComponentProps<typeof Icon>["name"],light:string,dark:string)=>function ControlIcon({size}:{size:number}) { return <Icon name={name} size={size} color={theme.dark?dark:light}/>; };
 const chip=(icon:React.ComponentProps<typeof Icon>["name"],label:string,iconColor=c.onSurfaceVariant)=><View style={{flexDirection:"row",alignItems:"center",gap:6,paddingHorizontal:12,minHeight:36,maxWidth:140,borderRadius:18,backgroundColor:tonalButtonSurface(theme)}}><Icon name={icon} size={16} color={iconColor}/><Text numberOfLines={1} style={{flexShrink:1,fontSize:12,fontWeight:"600",color:c.onSurfaceVariant}}>{label}</Text></View>;

 const managementControl=(label:string,icon:React.ComponentProps<typeof Icon>["name"],color:string,onPress:()=>void)=><Pressable accessibilityRole="button" accessibilityLabel={label === "Delete" ? "Delete schedule" : label} accessibilityState={{disabled:busy}} disabled={busy} onPress={onPress}
  style={({pressed})=>({flex:1,minHeight:48,borderRadius:24,borderWidth:1,borderColor:c.outlineVariant,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:6,paddingHorizontal:6,opacity:busy?0.4:pressed?0.7:1})}>
  <Icon name={icon} size={18} color={color}/><Text numberOfLines={1} style={{flexShrink:1,fontSize:12,fontWeight:"700",color:c.onSurface}}>{label}</Text>
 </Pressable>;

 return <>
  <ControlsSheet visible={Boolean(selection) && !selection?.quick} title="Recurring" displayTitle suspended={quick||editing||manual||deleting||busy} onClose={onClose}>
   <View style={{padding:20,borderRadius:theme.expressive?30:20,backgroundColor:heroBackground,gap:16}}>
    <View style={{flexDirection:"row",alignItems:"center",gap:12}}>
     <Icon name={template.icon as React.ComponentProps<typeof Icon>["name"]} size={30} color={heroText}/>
     <View style={{flex:1,gap:3}}><Text style={{fontSize:19,fontWeight:"800",color:heroText}}>{template.form.title}</Text><Text style={{fontSize:13,color:heroText,opacity:0.8}}>{template.form.category}</Text></View>
    </View>
    <View style={{flexDirection:"row",alignItems:"flex-end",gap:12}}>
     <View style={{flex:1,gap:12}}>
      <Text numberOfLines={1} adjustsFontSizeToFit style={{color:heroText,fontSize:36,fontWeight:"800"}}>{money(template.form.amount)}</Text>
      <View style={{flexDirection:"row",alignItems:"center",gap:6}}><Icon name={template.paused?"pause-circle-outline":"calendar-clock-outline"} size={18} color={heroText}/><Text style={{flexShrink:1,fontSize:13,fontWeight:"700",color:heroText}}>{template.paused?"Paused":`${occurrence?"Due":"Next"} ${recurringDate(occurrence?.dueDate||template.nextDate)}`}</Text></View>
     </View>
     <View style={{alignItems:"flex-end",gap:6,maxWidth:"48%"}}>
      {chip("repeat",frequencyLabel(template.frequency))}
      {chip(getAccountIconName(template.form.account,accountIcons) as React.ComponentProps<typeof Icon>["name"],template.form.account,getAccountColor(template.form.account,accountColors))}
     </View>
    </View>
   </View>
   <View style={{flexDirection:"row",gap:10}}>
    {managementControl("Edit","pencil-outline",theme.dark?"#CDB4EF":"#7651A8",()=>setEditing(true))}
    {managementControl(template.paused?"Resume":"Pause",template.paused?"play-outline":"pause",theme.dark?"#E8BF76":"#946513",()=>void run(()=>setRecurringState(template.workspaceId,template.id,template.paused?"resume":"pause"),template.paused?"Schedule resumed from its next due date":"Schedule paused"))}
    {managementControl("Delete","delete-outline",c.error,()=>setDeleting(true))}
   </View>
   {!!history.length&&<View style={{gap:10,marginTop:12}}><Text style={{color:c.onSurfaceVariant,fontSize:13,fontWeight:"700"}}>History</Text>
    <View style={{borderRadius:theme.expressive?24:16,overflow:"hidden",gap:2}}>{history.map(item=>{
     const label={confirmed:"Recorded",pending:"Due",skipped:"Skipped",missed:"Missed"}[item.status];
     const icon=({confirmed:"check-circle-outline",pending:"clock-outline",skipped:"skip-next-circle-outline",missed:"calendar-alert"} as const)[item.status];
     const color=item.status==="missed"?c.error:c.onSurfaceVariant;
     return <View key={item.dueDate} style={{flexDirection:"row",alignItems:"center",gap:10,padding:14,backgroundColor:c.surface}}>
      <Icon name={icon} size={20} color={color}/><Text style={{flex:1,fontSize:13,fontWeight:"600",color:c.onSurface}}>{new Date(`${item.dueDate}T12:00:00`).toLocaleDateString(undefined,{day:"numeric",month:"short",year:"numeric"})}</Text>
      <Text style={{fontSize:12,fontWeight:"700",color}}>{label}</Text>
     </View>;
    })}</View>
   </View>}
   {pending && <View style={{gap:10,marginTop:12}}>
    <Button mode="contained" icon="plus" disabled={busy} onPress={()=>setQuick(true)} style={{borderRadius:26}} contentStyle={{minHeight:52}} labelStyle={{fontWeight:"800"}}>Quick Add</Button>
    <View style={{flexDirection:"row",gap:10}}>
     <Button mode="outlined" icon={controlIcon("check-outline","#28764A","#8CD5A7")} textColor={c.onSurface} style={buttonStyle} contentStyle={{minHeight:48}} disabled={busy} onPress={()=>setManual(true)}>Already paid</Button>
     <Button mode="outlined" icon={controlIcon("skip-next-outline","#386DA1","#9DC9F3")} textColor={c.onSurface} style={buttonStyle} contentStyle={{minHeight:48}} disabled={busy} onPress={()=>void run(()=>skipRecurring(template.workspaceId,template.id,occurrence!.dueDate),"Occurrence skipped")}>Skip</Button>
    </View>
   </View>}
  </ControlsSheet>
  <TransactionModal isOpen={Boolean(selection)&&quick} onClose={closeChild} recurringOccurrence={prompt} />
  <TransactionModal isOpen={Boolean(selection)&&editing} onClose={()=>{setEditing(false);onClose();}} recurringTemplate={template} />
  <AnimatedPaperModal visible={Boolean(selection)&&manual} onDismiss={()=>{if(!busy)setManual(false);}} dismissable={!busy} presentation="sheet" contentContainerStyle={{backgroundColor:c.background,maxHeight:"80%",paddingVertical:16}}>
   <SettingsHeader modal title="Already paid" onBack={()=>{if(!busy)setManual(false);}} />
   <Text style={{color:c.onSurfaceVariant,paddingHorizontal:20,paddingBottom:12}}>Choose the transaction you already recorded. No new transaction will be created.</Text>
   <FlatList data={candidates} keyExtractor={item=>item.id} initialNumToRender={6} maxToRenderPerBatch={4} contentContainerStyle={{paddingHorizontal:16,paddingBottom:20,gap:4}}
    ListEmptyComponent={<Text style={{padding:20,color:c.onSurfaceVariant}}>No matching entries in the five-day window. Record the payment or use Quick Add.</Text>}
    renderItem={({item})=><View pointerEvents={busy?"none":"auto"}><TransactionRow transaction={item} disableLongPress showDivider={false} secondaryLabelMode="date" onPressTransaction={id=>void run(async()=>dispatch(confirmRecurringAsync({templateId:template.id,dueDate:occurrence!.dueDate,form:template.form,updateFutureAmount:false,existingTransactionId:id})).unwrap(),"Linked to the recorded transaction")} /></View>} />
  </AnimatedPaperModal>
  <AlertModal isOpen={deleting} title="Delete recurring schedule?" message="Reminders will stop. Previously recorded transactions and their history will stay unchanged." destructive confirmLabel="Delete schedule" confirmDisabled={busy}
   onCancel={()=>setDeleting(false)} onConfirm={async()=>{await run(()=>setRecurringState(template.workspaceId,template.id,"delete"),"Recurring schedule deleted");setDeleting(false);}} />
 </>;
}
