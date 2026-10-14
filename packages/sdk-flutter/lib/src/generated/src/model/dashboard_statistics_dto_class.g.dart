// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'dashboard_statistics_dto_class.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$DashboardStatisticsDtoClass extends DashboardStatisticsDtoClass {
  @override
  final num documentsTotal;
  @override
  final BuiltMap<String, num> byStatus;
  @override
  final num labelsAssignedCount;
  @override
  final num unlabeledCount;
  @override
  final BuiltList<DashboardStatisticsDtoClassTopLabelsInner> topLabels;

  factory _$DashboardStatisticsDtoClass(
          [void Function(DashboardStatisticsDtoClassBuilder)? updates]) =>
      (DashboardStatisticsDtoClassBuilder()..update(updates))._build();

  _$DashboardStatisticsDtoClass._(
      {required this.documentsTotal,
      required this.byStatus,
      required this.labelsAssignedCount,
      required this.unlabeledCount,
      required this.topLabels})
      : super._();
  @override
  DashboardStatisticsDtoClass rebuild(
          void Function(DashboardStatisticsDtoClassBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DashboardStatisticsDtoClassBuilder toBuilder() =>
      DashboardStatisticsDtoClassBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DashboardStatisticsDtoClass &&
        documentsTotal == other.documentsTotal &&
        byStatus == other.byStatus &&
        labelsAssignedCount == other.labelsAssignedCount &&
        unlabeledCount == other.unlabeledCount &&
        topLabels == other.topLabels;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, documentsTotal.hashCode);
    _$hash = $jc(_$hash, byStatus.hashCode);
    _$hash = $jc(_$hash, labelsAssignedCount.hashCode);
    _$hash = $jc(_$hash, unlabeledCount.hashCode);
    _$hash = $jc(_$hash, topLabels.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'DashboardStatisticsDtoClass')
          ..add('documentsTotal', documentsTotal)
          ..add('byStatus', byStatus)
          ..add('labelsAssignedCount', labelsAssignedCount)
          ..add('unlabeledCount', unlabeledCount)
          ..add('topLabels', topLabels))
        .toString();
  }
}

class DashboardStatisticsDtoClassBuilder
    implements
        Builder<DashboardStatisticsDtoClass,
            DashboardStatisticsDtoClassBuilder> {
  _$DashboardStatisticsDtoClass? _$v;

  num? _documentsTotal;
  num? get documentsTotal => _$this._documentsTotal;
  set documentsTotal(num? documentsTotal) =>
      _$this._documentsTotal = documentsTotal;

  MapBuilder<String, num>? _byStatus;
  MapBuilder<String, num> get byStatus =>
      _$this._byStatus ??= MapBuilder<String, num>();
  set byStatus(MapBuilder<String, num>? byStatus) =>
      _$this._byStatus = byStatus;

  num? _labelsAssignedCount;
  num? get labelsAssignedCount => _$this._labelsAssignedCount;
  set labelsAssignedCount(num? labelsAssignedCount) =>
      _$this._labelsAssignedCount = labelsAssignedCount;

  num? _unlabeledCount;
  num? get unlabeledCount => _$this._unlabeledCount;
  set unlabeledCount(num? unlabeledCount) =>
      _$this._unlabeledCount = unlabeledCount;

  ListBuilder<DashboardStatisticsDtoClassTopLabelsInner>? _topLabels;
  ListBuilder<DashboardStatisticsDtoClassTopLabelsInner> get topLabels =>
      _$this._topLabels ??=
          ListBuilder<DashboardStatisticsDtoClassTopLabelsInner>();
  set topLabels(
          ListBuilder<DashboardStatisticsDtoClassTopLabelsInner>? topLabels) =>
      _$this._topLabels = topLabels;

  DashboardStatisticsDtoClassBuilder() {
    DashboardStatisticsDtoClass._defaults(this);
  }

  DashboardStatisticsDtoClassBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _documentsTotal = $v.documentsTotal;
      _byStatus = $v.byStatus.toBuilder();
      _labelsAssignedCount = $v.labelsAssignedCount;
      _unlabeledCount = $v.unlabeledCount;
      _topLabels = $v.topLabels.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DashboardStatisticsDtoClass other) {
    _$v = other as _$DashboardStatisticsDtoClass;
  }

  @override
  void update(void Function(DashboardStatisticsDtoClassBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DashboardStatisticsDtoClass build() => _build();

  _$DashboardStatisticsDtoClass _build() {
    _$DashboardStatisticsDtoClass _$result;
    try {
      _$result = _$v ??
          _$DashboardStatisticsDtoClass._(
            documentsTotal: BuiltValueNullFieldError.checkNotNull(
                documentsTotal,
                r'DashboardStatisticsDtoClass',
                'documentsTotal'),
            byStatus: byStatus.build(),
            labelsAssignedCount: BuiltValueNullFieldError.checkNotNull(
                labelsAssignedCount,
                r'DashboardStatisticsDtoClass',
                'labelsAssignedCount'),
            unlabeledCount: BuiltValueNullFieldError.checkNotNull(
                unlabeledCount,
                r'DashboardStatisticsDtoClass',
                'unlabeledCount'),
            topLabels: topLabels.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'byStatus';
        byStatus.build();

        _$failedField = 'topLabels';
        topLabels.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'DashboardStatisticsDtoClass', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
