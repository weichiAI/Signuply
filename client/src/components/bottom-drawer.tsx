import type { ReactNode } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

type BottomDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
};

export function BottomDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
}: BottomDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="border-border/60 bg-card/96 px-0 pb-6">
        <DrawerHeader className="px-5">
          <DrawerTitle>{title}</DrawerTitle>
          {description ? <DrawerDescription>{description}</DrawerDescription> : null}
        </DrawerHeader>
        <div className="px-5">{children}</div>
      </DrawerContent>
    </Drawer>
  );
}
