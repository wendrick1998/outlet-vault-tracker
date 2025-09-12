import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface Field {
  name: string;
  label: string;
  type: 'text' | 'number';
  placeholder?: string;
  required?: boolean;
  min?: number;
  max?: number;
}

interface CatalogItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  fields: Field[];
  defaultValues: Record<string, any>;
  onSubmit: (data: any) => Promise<void> | void;
  isLoading?: boolean;
}

export const CatalogItemDialog = ({
  open,
  onOpenChange,
  title,
  fields,
  defaultValues,
  onSubmit,
  isLoading = false,
}: CatalogItemDialogProps) => {
  // Create dynamic schema based on fields
  const schemaFields = fields.reduce((acc, field) => {
    let fieldSchema: any;
    
    if (field.type === 'number') {
      fieldSchema = z.number();
      if (field.min !== undefined) fieldSchema = fieldSchema.min(field.min);
      if (field.max !== undefined) fieldSchema = fieldSchema.max(field.max);
    } else {
      fieldSchema = z.string();
      if (field.required) fieldSchema = fieldSchema.min(1, `${field.label} é obrigatório`);
    }
    
    acc[field.name] = fieldSchema;
    return acc;
  }, {} as Record<string, any>);

  const schema = z.object(schemaFields);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const handleSubmit = async (data: any) => {
    try {
      await onSubmit(data);
      form.reset();
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {fields.map((field) => (
              <FormField
                key={field.name}
                control={form.control}
                name={field.name}
                render={({ field: formField }) => (
                  <FormItem>
                    <FormLabel>{field.label}</FormLabel>
                    <FormControl>
                      <Input
                        type={field.type}
                        placeholder={field.placeholder}
                        min={field.min}
                        max={field.max}
                        {...formField}
                        onChange={(e) => {
                          const value = field.type === 'number' 
                            ? parseInt(e.target.value) || 0
                            : e.target.value;
                          formField.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};