import React, { useEffect, useMemo, useState } from 'react';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import API from '../../services/API';
import type { BookData } from '../../types/BookData';
import Loading from '../../components/common/Loading';

interface GenreOption { label: string; value: string; }
interface SeriesOption {
  label: string;
  value: string;
  __isNew__?: boolean;
  title?: string;
  bookCount?: number;
}

interface AddBookModalProps {
  show: boolean;
  onCancel: () => void;
  bookData: BookData; 
  setBookData: React.Dispatch<React.SetStateAction<BookData>>; 
  onSave: (newBookData: BookData) => Promise<void>; 
  genreOptions: GenreOption[];
  onSuccess?: () => void; 
}

const AddBookModal: React.FC<AddBookModalProps> = ({
  show,
  onCancel,
  genreOptions,
  onSuccess,
}) => {
  const [bookData, setBookData] = useState<BookData>({
    name: '',
    author: '',
    genre: '',
    description: '',
    file: null,
    cover: null,
    isSeries: false,
    seriesId: null,
    seriesTitleNew: null,
    volumeNumber: null,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [seriesOptions, setSeriesOptions] = useState<SeriesOption[]>([]);
  const [seriesLoading, setSeriesLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load series
  useEffect(() => {
    if (!show) return;
    (async () => {
      try {
        setSeriesLoading(true);
        const res = await fetch(`${API.series}?includeBooks=false`);
        const data = await res.json();
        const items = (data.items ?? data ?? []).map((s: any) => ({
          label: s.title,
          value: s.id,
          bookCount: s.bookCount,
        })) as SeriesOption[];
        setSeriesOptions(items);
      } catch (e) {
        console.error('Load series failed', e);
      } finally {
        setSeriesLoading(false);
      }
    })();
  }, [show]);

  const handleChange = (field: keyof BookData, value: any) => {
    setBookData((prev) => ({ ...prev, [field]: value }));
    // clear lỗi khi người dùng sửa
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const selectedSeries = useMemo<SeriesOption | null>(() => {
    if (bookData.seriesId) {
      const found = seriesOptions.find((o) => o.value === bookData.seriesId);
      return found ?? null;
    }
    if (bookData.seriesTitleNew) {
      return {
        label: bookData.seriesTitleNew,
        value: `__NEW__:${bookData.seriesTitleNew}`,
        __isNew__: true,
        title: bookData.seriesTitleNew,
      };
    }
    return null;
  }, [bookData.seriesId, bookData.seriesTitleNew, seriesOptions]);

  const handleSelectSeries = (opt: SeriesOption | null) => {
    if (!opt) {
      handleChange('isSeries', false);
      handleChange('seriesId', null);
      handleChange('seriesTitleNew', null);
      return;
    }
    handleChange('isSeries', true);
    if (opt.__isNew__ || opt.value.startsWith('__NEW__:')) {
      const title = (opt.title ?? opt.label).trim();
      handleChange('seriesId', null);
      handleChange('seriesTitleNew', title || null);
      handleChange('volumeNumber', 1);
    } else {
      handleChange('seriesId', opt.value);
      handleChange('seriesTitleNew', null);
    }
  };

  // Auto volume cho bộ cũ
  useEffect(() => {
    if (bookData.isSeries && bookData.seriesId) {
      const found = seriesOptions.find((o) => o.value === bookData.seriesId);
      if (found?.bookCount != null) {
        handleChange('volumeNumber', (found.bookCount || 0) + 1);
        return;
      }
      (async () => {
        try {
          const res = await fetch(`${API.series}/${bookData.seriesId}?includeBooks=true`);
          const data = await res.json();
          const next = (data?.books?.length ?? 0) + 1;
          handleChange('volumeNumber', next);
        } catch (e) {
          console.error('Load series detail failed', e);
        }
      })();
    }
  }, [bookData.isSeries, bookData.seriesId, seriesOptions]);

  const handleToggleSeries = (checked: boolean) => {
    handleChange('isSeries', checked);
    if (!checked) {
      setBookData((prev) => ({
        ...prev,
        seriesId: null,
        seriesTitleNew: null,
        volumeNumber: null,
      }));
    }
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!bookData.name?.trim()) newErrors.name = 'Vui lòng nhập tên sách';
    if (!bookData.author?.trim()) newErrors.author = 'Vui lòng nhập tên tác giả';
    if (!bookData.genre?.trim()) newErrors.genre = 'Vui lòng chọn thể loại';
    if (!bookData.file) newErrors.file = 'Vui lòng chọn file PDF';
    if (!bookData.cover) newErrors.cover = 'Vui lòng chọn ảnh bìa';

    if (bookData.isSeries) {
      const hasExisting = !!bookData.seriesId;
      const hasNew = !!bookData.seriesTitleNew?.trim();
      if (!hasExisting && !hasNew) newErrors.series = 'Vui lòng chọn hoặc nhập tên bộ';
      if (!bookData.volumeNumber || bookData.volumeNumber < 1) newErrors.volumeNumber = 'Số tập không hợp lệ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return; // Nếu có lỗi thì dừng

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', bookData.name);
      formData.append('author', bookData.author);
      formData.append('genre', bookData.genre);
      formData.append('description', bookData.description || '');
      formData.append('isSeries', String(!!bookData.isSeries));
      if (bookData.seriesId) formData.append('seriesId', bookData.seriesId);
      if (bookData.seriesTitleNew) formData.append('seriesTitleNew', bookData.seriesTitleNew);
      if (bookData.volumeNumber != null) formData.append('volumeNumber', String(bookData.volumeNumber));
      if (bookData.file) formData.append('pdf', bookData.file);
      if (bookData.cover) formData.append('cover', bookData.cover);

      const res = await fetch(`${API.books}`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error(await res.text());

      const book = await res.json();
      console.log('Tạo sách thành công:', book);
      if (onSuccess) onSuccess();
      onCancel();
    } catch (err) {
      console.error('Lỗi khi lưu sách:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-[380px] shadow-xl">
        <h2 className="text-xl font-semibold text-center mb-4">Thêm sách mới</h2>

        <input
          type="file"
          accept=".pdf"
          onChange={(e) => handleChange('file', e.target.files?.[0] || null)}
          className="mb-1 w-full text-sm"
        />
        {errors.file && <p className="text-xs text-red-500 mb-2">{errors.file}</p>}

        <input
          type="text"
          placeholder="Tên sách"
          value={bookData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          className="mb-1 w-full p-2 border rounded"
        />
        {errors.name && <p className="text-xs text-red-500 mb-2">{errors.name}</p>}

        <input
          type="text"
          placeholder="Tác giả"
          value={bookData.author}
          onChange={(e) => handleChange('author', e.target.value)}
          className="mb-1 w-full p-2 border rounded"
        />
        {errors.author && <p className="text-xs text-red-500 mb-2">{errors.author}</p>}

        <Select
          options={genreOptions}
          value={genreOptions.find((opt) => opt.label === bookData.genre)}
          onChange={(selected) => handleChange('genre', (selected as any)?.label || '')}
          placeholder="Chọn thể loại..."
          isClearable
          className="mb-1"
        />
        {errors.genre && <p className="text-xs text-red-500 mb-2">{errors.genre}</p>}

        <textarea
          placeholder="Mô tả"
          value={bookData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          className="mb-3 w-full p-2 border rounded resize-none"
          rows={3}
        />

        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleChange('cover', e.target.files?.[0] || null)}
          className="mb-1 w-full text-sm"
        />
        {errors.cover && <p className="text-xs text-red-500 mb-2">{errors.cover}</p>}

        {/* Sách theo bộ */}
        <label className="flex items-center gap-2 mb-2 select-none">
          <input
            type="checkbox"
            checked={!!bookData.isSeries}
            onChange={(e) => handleToggleSeries(e.target.checked)}
            className="h-4 w-4"
          />
          <span>Sách theo bộ</span>
        </label>

        {bookData.isSeries && (
          <>
            <div className="mb-1">
              <CreatableSelect
                isClearable
                isLoading={seriesLoading}
                options={seriesOptions}
                value={selectedSeries}
                onChange={(opt) => handleSelectSeries(opt as SeriesOption | null)}
                placeholder="Chọn bộ có sẵn hoặc gõ để tạo mới…"
                formatCreateLabel={(input) => `Tạo bộ mới: "${input}"`}
              />
              {errors.series && <p className="text-xs text-red-500 mt-1">{errors.series}</p>}
            </div>

            <div className="mb-4">
              <input
                type="number"
                min={1}
                placeholder="Số tập"
                value={bookData.volumeNumber ?? ''}
                disabled
                className="w-full p-2 border rounded bg-gray-100 cursor-not-allowed"
              />
              {errors.volumeNumber && <p className="text-xs text-red-500 mt-1">{errors.volumeNumber}</p>}
            </div>
          </>
        )}

        <div className="flex justify-between">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-4 py-2 text-white rounded ${saving ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            Lưu
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
          >
            Hủy
          </button>
        </div>
      </div>
      {saving ? <Loading /> : 'Lưu'}
    </div>
  );
};

export default AddBookModal;
