/**
 * Matter Select Component
 * Searchable select for choosing a matter/case
 * P57: Time Tracking Module
 */

import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';

export interface MatterOption {
  id: string;
  reference: string;
  title: string;
}

interface MatterSelectProps {
  value: MatterOption | null;
  onChange: (matter: MatterOption | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function MatterSelect({
  value,
  onChange,
  placeholder = "Seleccionar expediente...",
  disabled = false,
  className,
}: MatterSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { currentOrganization } = useOrganization();

  // Fetch matters
  const { data: matters = [], isLoading } = useQuery({
    queryKey: ['matters-select', currentOrganization?.id, search],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];

      let query = supabase
        .from('matters')
        .select('id, reference, title')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (search) {
        query = query.or(`reference.ilike.%${search}%,title.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as MatterOption[];
    },
    enabled: !!currentOrganization?.id,
  });

  const selectedMatter = value || matters.find(m => m.id === value?.id);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          {value ? (
            <span className="flex items-center gap-2 truncate">
              <Briefcase className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="font-medium">{value.reference}</span>
              <span className="text-muted-foreground truncate">- {value.title}</span>
            </span>
          ) : (
            <span>{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Buscar expediente..." 
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? 'Cargando...' : 'No se encontraron expedientes'}
            </CommandEmpty>
            <CommandGroup>
              {matters.map((matter) => (
                <CommandItem
                  key={matter.id}
                  value={matter.id}
                  onSelect={() => {
                    onChange(matter.id === value?.id ? null : matter);
                    setOpen(false);
                    setSearch('');
                  }}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value?.id === matter.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{matter.reference}</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {matter.title}
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
