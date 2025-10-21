'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Search } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';

const searchFormSchema = z.object({
  query: z.string().min(1, '검색어를 입력해주세요'),
});

type SearchFormData = z.infer<typeof searchFormSchema>;

export const SearchBar = () => {
  const openModal = useAppStore((state) => state.openModal);

  const form = useForm<SearchFormData>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: { query: '' },
  });

  const onSubmit = (data: SearchFormData) => {
    openModal('search-results', { searchQuery: data.query });
  };

  return (
    <div className="w-full bg-white border-b shadow-sm p-4">
      <div className="max-w-2xl mx-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2">
            <FormField
              control={form.control}
              name="query"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input
                      placeholder="음식점명 또는 지역명을 입력하세요"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" size="icon">
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};
