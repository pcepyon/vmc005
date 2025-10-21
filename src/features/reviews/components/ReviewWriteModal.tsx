'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateReview } from '@/features/reviews/hooks/useCreateReview';
import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

const reviewFormSchema = z.object({
  author_name: z
    .string()
    .min(1, '작성자명을 입력해주세요')
    .max(100, '작성자명은 100자를 초과할 수 없습니다'),
  rating: z
    .number()
    .int()
    .min(1, '별점을 선택해주세요')
    .max(5, '별점은 1~5 사이여야 합니다'),
  content: z
    .string()
    .min(1, '리뷰 내용을 입력해주세요')
    .max(500, '리뷰 내용은 500자를 초과할 수 없습니다'),
  password: z.string().regex(/^\d{4}$/, '비밀번호는 4자리 숫자여야 합니다'),
});

type ReviewFormData = z.infer<typeof reviewFormSchema>;

interface ReviewWriteModalProps {
  placeId: string;
  placeName: string;
  placeAddress: string;
}

export const ReviewWriteModal = ({
  placeId,
  placeName,
  placeAddress,
}: ReviewWriteModalProps) => {
  const { modalState, goBackModal } = useAppStore();
  const createReview = useCreateReview();

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      author_name: '',
      rating: 0,
      content: '',
      password: '',
    },
  });

  const onSubmit = async (data: ReviewFormData) => {
    try {
      await createReview.mutateAsync({
        place_id: placeId,
        ...data,
      });
      form.reset();
      goBackModal();
    } catch (error) {
      form.setError('root', {
        message: error instanceof Error ? error.message : '리뷰 작성에 실패했습니다',
      });
    }
  };

  const isOpen = modalState === 'review-write';

  return (
    <Dialog open={isOpen} onOpenChange={() => goBackModal()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>리뷰 작성하기</DialogTitle>
        </DialogHeader>

        <div className="mb-4 p-3 bg-gray-50 rounded">
          <p className="font-semibold">{placeName}</p>
          <p className="text-sm text-gray-600">{placeAddress}</p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="author_name">작성자명 *</Label>
            <Input
              id="author_name"
              {...form.register('author_name')}
              placeholder="이름을 입력하세요"
            />
            {form.formState.errors.author_name && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.author_name.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="rating">별점 *</Label>
            <select
              id="rating"
              {...form.register('rating', { valueAsNumber: true })}
              className="w-full border rounded px-3 py-2"
            >
              <option value={0}>별점 선택</option>
              <option value={1}>⭐ 1점</option>
              <option value={2}>⭐⭐ 2점</option>
              <option value={3}>⭐⭐⭐ 3점</option>
              <option value={4}>⭐⭐⭐⭐ 4점</option>
              <option value={5}>⭐⭐⭐⭐⭐ 5점</option>
            </select>
            {form.formState.errors.rating && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.rating.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="content">리뷰 내용 *</Label>
            <Textarea
              id="content"
              {...form.register('content')}
              placeholder="리뷰를 작성해주세요 (최대 500자)"
              rows={5}
            />
            <div className="flex justify-between items-center mt-1">
              {form.formState.errors.content && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.content.message}
                </p>
              )}
              <p className="text-sm text-gray-500 ml-auto">
                {form.watch('content')?.length || 0} / 500자
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="password">비밀번호 (4자리 숫자) *</Label>
            <Input
              id="password"
              type="password"
              {...form.register('password')}
              placeholder="4자리 숫자"
              maxLength={4}
            />
            {form.formState.errors.password && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          {form.formState.errors.root && (
            <Alert variant="destructive">
              <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => goBackModal()}
              disabled={createReview.isPending}
            >
              취소
            </Button>
            <Button type="submit" disabled={createReview.isPending}>
              {createReview.isPending ? '작성 중...' : '리뷰 작성하기'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
