/**
 * Ícones do StayFlow (Phosphor). Todos os componentes importam daqui, nunca
 * da biblioteca diretamente: para mudar o traço ou o conjunto, altere este
 * ficheiro. Os nomes são os da interface (não os da biblioteca).
 *
 * Usa a versão "ssr" do Phosphor, que funciona em componentes de servidor e
 * de cliente.
 */
import type { Icon as PhosphorIcon, IconProps, IconWeight } from "@phosphor-icons/react";
import * as P from "@phosphor-icons/react/ssr";

export type IconComponent = (props: IconProps) => React.JSX.Element;
export type { IconProps, IconWeight };

function icon(Base: PhosphorIcon, defaultWeight: IconWeight = "regular"): IconComponent {
  function StayFlowIcon({ weight = defaultWeight, ...props }: IconProps) {
    return <Base weight={weight} {...props} />;
  }
  StayFlowIcon.displayName = Base.displayName;
  return StayFlowIcon;
}

export const Activity = icon(P.Pulse);
export const AlertCircle = icon(P.WarningCircle);
export const AlertTriangle = icon(P.Warning);
export const TriangleAlert = AlertTriangle;
export const Archive = icon(P.Archive);
export const ArchiveRestore = icon(P.BoxArrowUp);
export const ArrowDown = icon(P.ArrowDown);
export const ArrowLeft = icon(P.ArrowLeft);
export const ArrowRight = icon(P.ArrowRight);
export const ArrowUp = icon(P.ArrowUp);
export const ArrowUpRight = icon(P.ArrowUpRight);
export const BarChart3 = icon(P.ChartBar);
export const Bath = icon(P.Bathtub);
export const BedDouble = icon(P.Bed);
export const Building2 = icon(P.Buildings);
export const CalendarCheck = icon(P.CalendarCheck);
export const CalendarClock = icon(P.CalendarDots);
export const CalendarDays = icon(P.CalendarBlank);
export const CalendarRange = icon(P.CalendarDots);
export const Camera = icon(P.Camera);
export const Check = icon(P.Check, "bold");
export const CheckCircle2 = icon(P.CheckCircle);
export const ChevronDown = icon(P.CaretDown);
export const ChevronLeft = icon(P.CaretLeft);
export const ChevronRight = icon(P.CaretRight);
export const ChevronsUpDown = icon(P.CaretUpDown);
export const ClipboardCheck = icon(P.ClipboardText);
export const ClipboardList = icon(P.ListChecks);
export const Clock = icon(P.Clock);
export const Construction = icon(P.Barricade);
export const CreditCard = icon(P.CreditCard);
export const Copy = icon(P.Copy);
export const FileText = icon(P.FileText);
export const Flame = icon(P.Fire, "fill");
export const ImageIcon = icon(P.Image);
export const Info = icon(P.Info);
export const KeyRound = icon(P.Key);
export const Landmark = icon(P.Bank);
export const LayoutDashboard = icon(P.SquaresFour);
export const Link2 = icon(P.Link);
export const List = icon(P.List);
export const ListTodo = icon(P.CheckSquareOffset);
export const Loader2 = icon(P.CircleNotch, "bold");
export const Lock = icon(P.Lock);
export const LogOut = icon(P.SignOut);
export const Mail = icon(P.EnvelopeSimple);
export const MailCheck = icon(P.EnvelopeSimpleOpen);
export const MapPin = icon(P.MapPin);
export const Menu = icon(P.List);
export const MoreHorizontal = icon(P.DotsThree, "bold");
export const Paperclip = icon(P.Paperclip);
export const Pencil = icon(P.PencilSimple);
export const Phone = icon(P.Phone);
export const Plus = icon(P.Plus, "bold");
export const Receipt = icon(P.Receipt);
export const RotateCcw = icon(P.ArrowCounterClockwise);
export const Search = icon(P.MagnifyingGlass);
export const Settings = icon(P.GearSix);
export const ShieldCheck = icon(P.ShieldCheck);
export const Sparkles = icon(P.Broom);
export const Store = icon(P.Storefront);
export const Tag = icon(P.Tag);
export const Trash2 = icon(P.Trash);
export const TrendingUp = icon(P.TrendUp);
export const User = icon(P.User);
export const UserRound = icon(P.UserCircle);
export const Users = icon(P.Users);
export const Wallet = icon(P.Wallet);
export const Wrench = icon(P.Wrench);
export const X = icon(P.X);
export const XCircle = icon(P.XCircle);
