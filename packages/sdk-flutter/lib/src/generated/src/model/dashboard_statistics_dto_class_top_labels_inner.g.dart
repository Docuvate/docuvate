// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'dashboard_statistics_dto_class_top_labels_inner.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$DashboardStatisticsDtoClassTopLabelsInner
    extends DashboardStatisticsDtoClassTopLabelsInner {
  @override
  final String name;
  @override
  final num count;

  factory _$DashboardStatisticsDtoClassTopLabelsInner(
          [void Function(DashboardStatisticsDtoClassTopLabelsInnerBuilder)?
              updates]) =>
      (new DashboardStatisticsDtoClassTopLabelsInnerBuilder()..update(updates))
          ._build();

  _$DashboardStatisticsDtoClassTopLabelsInner._(
      {required this.name, required this.count})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        name, r'DashboardStatisticsDtoClassTopLabelsInner', 'name');
    BuiltValueNullFieldError.checkNotNull(
        count, r'DashboardStatisticsDtoClassTopLabelsInner', 'count');
  }

  @override
  DashboardStatisticsDtoClassTopLabelsInner rebuild(
          void Function(DashboardStatisticsDtoClassTopLabelsInnerBuilder)
              updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DashboardStatisticsDtoClassTopLabelsInnerBuilder toBuilder() =>
      new DashboardStatisticsDtoClassTopLabelsInnerBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DashboardStatisticsDtoClassTopLabelsInner &&
        name == other.name &&
        count == other.count;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, name.hashCode);
    _$hash = $jc(_$hash, count.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(
            r'DashboardStatisticsDtoClassTopLabelsInner')
          ..add('name', name)
          ..add('count', count))
        .toString();
  }
}

class DashboardStatisticsDtoClassTopLabelsInnerBuilder
    implements
        Builder<DashboardStatisticsDtoClassTopLabelsInner,
            DashboardStatisticsDtoClassTopLabelsInnerBuilder> {
  _$DashboardStatisticsDtoClassTopLabelsInner? _$v;

  String? _name;
  String? get name => _$this._name;
  set name(String? name) => _$this._name = name;

  num? _count;
  num? get count => _$this._count;
  set count(num? count) => _$this._count = count;

  DashboardStatisticsDtoClassTopLabelsInnerBuilder() {
    DashboardStatisticsDtoClassTopLabelsInner._defaults(this);
  }

  DashboardStatisticsDtoClassTopLabelsInnerBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _name = $v.name;
      _count = $v.count;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DashboardStatisticsDtoClassTopLabelsInner other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$DashboardStatisticsDtoClassTopLabelsInner;
  }

  @override
  void update(
      void Function(DashboardStatisticsDtoClassTopLabelsInnerBuilder)?
          updates) {
    if (updates != null) updates(this);
  }

  @override
  DashboardStatisticsDtoClassTopLabelsInner build() => _build();

  _$DashboardStatisticsDtoClassTopLabelsInner _build() {
    final _$result = _$v ??
        new _$DashboardStatisticsDtoClassTopLabelsInner._(
            name: BuiltValueNullFieldError.checkNotNull(
                name, r'DashboardStatisticsDtoClassTopLabelsInner', 'name'),
            count: BuiltValueNullFieldError.checkNotNull(
                count, r'DashboardStatisticsDtoClassTopLabelsInner', 'count'));
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
