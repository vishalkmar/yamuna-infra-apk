import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import ScreenContainer from '../../components/ScreenContainer';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusChip from '../../components/StatusChip';
import EmptyState from '../../components/EmptyState';
import { CardSkeleton } from '../../components/Skeleton';
import ReferralSheet from '../../components/ReferralSheet';
import { palette, radius, spacing, typography } from '../../theme';
import { formatINR } from '../../utils/format';
import { showToast } from '../../utils/toastConfig';
import {
  loadBalance, loadOffers, loadInvestments, loadReferrals, redeemOffer,
} from '../../store/slices/rewardsSlice';

const STATUS_LABEL = { pre_launch: 'PRE-LAUNCH', launching: 'LAUNCHING', open: 'OPEN' };
const STATUS_VARIANT = { pre_launch: 'warning', launching: 'info', open: 'success' };

export default function RewardsScreen() {
  const dispatch = useDispatch();
  const { points, offers, investments, referrals, loading, redeemBusy } = useSelector(s => s.rewards);
  const [referOpen, setReferOpen] = useState(false);

  const reload = useCallback(() => {
    dispatch(loadBalance());
    dispatch(loadOffers());
    dispatch(loadInvestments());
    dispatch(loadReferrals());
  }, [dispatch]);

  useEffect(() => { reload(); }, [reload]);

  const redeem = async offer => {
    try {
      const res = await dispatch(redeemOffer(offer.id)).unwrap();
      showToast('success', 'Redeemed!', `${offer.title}. Balance: ${res.balance} pts.`);
    } catch (e) {
      showToast('error', 'Could not redeem', String(e));
    }
  };

  return (
    <ScreenContainer refreshing={loading} onRefresh={reload}>
      <Card style={styles.hero}>
        <Text style={styles.heroLabel}>REWARD POINTS</Text>
        <Text style={styles.points}>{points}</Text>
        <Text style={styles.heroSub}>Earn points on payments & referrals. Redeem for partner offers below.</Text>
      </Card>

      {/* Offers */}
      <Text style={[typography.h3, styles.sectionTitle]}>Redeem offers</Text>
      {loading && offers.length === 0 ? <CardSkeleton /> : offers.map(o => {
        const affordable = points >= o.pointsCost;
        return (
          <Card key={o.id} style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.name}>{o.title}</Text>
              <Text style={styles.cost}>{o.pointsCost} pts</Text>
            </View>
            <Text style={typography.caption}>{o.partner} · {o.description}</Text>
            <TouchableOpacity
              style={[styles.redeemBtn, !affordable && styles.redeemDisabled]}
              disabled={!affordable || redeemBusy}
              onPress={() => redeem(o)}
            >
              <Text style={[styles.redeemText, !affordable && { color: palette.textMuted }]}>
                {affordable ? 'Redeem' : 'Not enough points'}
              </Text>
            </TouchableOpacity>
          </Card>
        );
      })}

      {/* Referral */}
      <Text style={[typography.h3, styles.sectionTitle]}>Refer & earn</Text>
      <Card style={styles.card}>
        <Text style={typography.body}>Refer friends & family — earn ₹25,000 when they book a home.</Text>
        <Button title="＋ Refer Someone" onPress={() => setReferOpen(true)} style={{ marginTop: spacing.sm }} />
      </Card>
      {referrals.map(r => (
        <Card key={r.id} style={styles.card}>
          <View style={styles.cardTop}>
            <Text style={styles.name}>{r.refereeName}</Text>
            <StatusChip label={String(r.status).toUpperCase()} variant="info" />
          </View>
          <Text style={typography.caption}>{r.relationship}{r.interestedIn ? ` · ${r.interestedIn}` : ''}</Text>
        </Card>
      ))}

      {/* Investments */}
      <Text style={[typography.h3, styles.sectionTitle]}>New project opportunities</Text>
      {investments.length === 0 ? <EmptyState icon="🏗️" message="No projects right now." /> : investments.map(p => (
        <Card key={p.id} style={styles.card}>
          <View style={styles.cardTop}>
            <Text style={styles.name}>{p.name}</Text>
            <StatusChip label={STATUS_LABEL[p.status] || p.status} variant={STATUS_VARIANT[p.status] || 'neutral'} />
          </View>
          <Text style={typography.caption}>{p.location}</Text>
          <Text style={typography.caption}>{p.description}</Text>
          <Text style={styles.price}>From {formatINR(p.priceFrom)}</Text>
        </Card>
      ))}

      <ReferralSheet visible={referOpen} projects={investments} onClose={() => setReferOpen(false)} onDone={() => dispatch(loadReferrals())} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: palette.primary, borderColor: palette.primary, marginBottom: spacing.md, alignItems: 'center' },
  heroLabel: { color: '#A8B2D4', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  points: { color: '#fff', fontSize: 44, fontWeight: '900', marginVertical: 4 },
  heroSub: { color: '#DBE3FF', fontSize: 12, textAlign: 'center', lineHeight: 18 },

  sectionTitle: { marginBottom: spacing.sm, marginTop: spacing.sm },
  card: { marginBottom: spacing.sm },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  name: { fontSize: 15, fontWeight: '700', color: palette.text, flex: 1 },
  cost: { fontSize: 13, fontWeight: '800', color: palette.accent },
  price: { fontSize: 14, fontWeight: '800', color: palette.primary, marginTop: 6 },
  redeemBtn: { marginTop: spacing.sm, paddingVertical: 9, borderRadius: radius.md, borderWidth: 1.5, borderColor: palette.primary, alignItems: 'center' },
  redeemDisabled: { borderColor: palette.border },
  redeemText: { color: palette.primary, fontWeight: '700', fontSize: 13 },
});
