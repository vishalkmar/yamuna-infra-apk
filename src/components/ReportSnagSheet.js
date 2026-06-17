import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';

import Input from './Input';
import Button from './Button';
import RadioGroup from './RadioGroup';
import Dropdown from './Dropdown';
import { palette, radius, spacing, typography } from '../theme';
import { reportSnag } from '../store/slices/snagSlice';
import { showToast } from '../utils/toastConfig';

const LOCATIONS = [
  'Bedroom 1', 'Bedroom 2', 'Hall', 'Kitchen', 'Bathroom 1', 'Bathroom 2', 'Balcony', 'Other',
].map(l => ({ value: l, label: l }));

const DEFECT_TYPES = [
  { value: 'plumbing',   label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'flooring',   label: 'Flooring' },
  { value: 'paint',      label: 'Paint' },
  { value: 'fixture',    label: 'Fixture' },
  { value: 'other',      label: 'Other' },
];

const schema = Yup.object().shape({
  location: Yup.string().oneOf(LOCATIONS.map(l => l.value)).required('Select a location'),
  defectType: Yup.string().oneOf(DEFECT_TYPES.map(d => d.value)).required('Select a defect type'),
  description: Yup.string().min(15, 'Min 15 characters').max(1000, 'Max 1000 characters').required('Describe the defect'),
  severity: Yup.string().oneOf(['minor', 'major', 'critical']).required('Choose severity'),
});

const defaults = () => ({ location: 'Hall', defectType: 'plumbing', description: '', severity: 'minor' });

export default function ReportSnagSheet({ visible, bookingId, onClose, onReported }) {
  const dispatch = useDispatch();
  const { reportBusy } = useSelector(s => s.snag);
  const [photos, setPhotos] = useState([]);
  const [photoError, setPhotoError] = useState(null);

  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: defaults(),
  });

  useEffect(() => {
    if (visible) { reset(defaults()); setPhotos([]); setPhotoError(null); }
  }, [visible, reset]);

  const description = watch('description') || '';

  const addPhoto = () => {
    if (photos.length >= 5) return;
    // Real build uses react-native-image-picker; demo appends a sample image.
    setPhotos(p => [...p, `https://picsum.photos/seed/snag${Date.now()}/600/400`]);
    setPhotoError(null);
  };
  const removePhoto = i => setPhotos(p => p.filter((_, idx) => idx !== i));

  const submit = async data => {
    if (photos.length === 0) {
      setPhotoError('Add at least one photo of the defect');
      return;
    }
    try {
      const result = await dispatch(reportSnag({ bookingId, ...data, photos })).unwrap();
      showToast('success', 'Reported!', `Snag #${result.snagCode} logged. It will be resolved before possession.`);
      onReported?.(result);
      onClose();
    } catch (e) {
      showToast('error', 'Could not report', String(e));
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={typography.h2}>Report a Snag</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Text style={styles.close}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Controller
              control={control}
              name="location"
              render={({ field: { value, onChange } }) => (
                <Dropdown label="Location" value={value} options={LOCATIONS} onChange={onChange} error={errors.location?.message} />
              )}
            />

            <Controller
              control={control}
              name="defectType"
              render={({ field: { value, onChange } }) => (
                <Dropdown label="Defect type" value={value} options={DEFECT_TYPES} onChange={onChange} error={errors.defectType?.message} />
              )}
            />

            <Controller
              control={control}
              name="description"
              render={({ field: { value, onChange } }) => (
                <Input
                  label="Description"
                  value={value}
                  onChangeText={onChange}
                  multiline
                  numberOfLines={4}
                  maxLength={1000}
                  placeholder="Describe the defect clearly…"
                  error={errors.description?.message}
                  hint={`${description.length} / 1000 (min 15)`}
                />
              )}
            />

            <Controller
              control={control}
              name="severity"
              render={({ field: { value, onChange } }) => (
                <RadioGroup
                  label="Severity"
                  value={value}
                  onChange={onChange}
                  options={[
                    { value: 'minor', label: 'Minor' },
                    { value: 'major', label: 'Major' },
                    { value: 'critical', label: 'Critical' },
                  ]}
                  error={errors.severity?.message}
                />
              )}
            />

            {/* Photos */}
            <Text style={typography.label}>Photos ({photos.length}/5)</Text>
            <View style={styles.photoRow}>
              {photos.map((uri, i) => (
                <TouchableOpacity key={uri} onPress={() => removePhoto(i)} style={styles.thumbWrap}>
                  <Image source={{ uri }} style={styles.thumb} />
                  <View style={styles.removeBadge}><Text style={styles.removeText}>×</Text></View>
                </TouchableOpacity>
              ))}
              {photos.length < 5 ? (
                <TouchableOpacity style={styles.addPhoto} onPress={addPhoto}>
                  <Text style={styles.addPhotoText}>＋</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            {photoError ? <Text style={styles.err}>{photoError}</Text> : null}

            <Button
              title={reportBusy ? 'Submitting…' : 'Submit Snag'}
              onPress={handleSubmit(submit)}
              loading={reportBusy}
              style={{ marginTop: spacing.md }}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: palette.background,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: spacing.lg, paddingBottom: spacing.xxl,
    maxHeight: '92%',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  close: { fontSize: 26, color: palette.textMuted },

  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: 6 },
  thumbWrap: { width: 64, height: 64, marginRight: spacing.sm, marginBottom: spacing.sm },
  thumb: { width: 64, height: 64, borderRadius: radius.sm, backgroundColor: palette.surfaceAlt },
  removeBadge: {
    position: 'absolute', top: -6, right: 0,
    backgroundColor: palette.error, width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  removeText: { color: '#fff', fontSize: 13, fontWeight: '800', lineHeight: 15 },
  addPhoto: {
    width: 64, height: 64, borderRadius: radius.sm,
    borderWidth: 1.5, borderColor: palette.primary, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
  addPhotoText: { fontSize: 26, color: palette.primary },
  err: { color: palette.error, fontSize: 12, marginTop: 4 },
});
