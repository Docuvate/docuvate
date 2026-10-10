// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'dashboard_widget_dto_class.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const DashboardWidgetDtoClassTypeEnum
    _$dashboardWidgetDtoClassTypeEnum_savedView =
    const DashboardWidgetDtoClassTypeEnum._('savedView');
const DashboardWidgetDtoClassTypeEnum _$dashboardWidgetDtoClassTypeEnum_upload =
    const DashboardWidgetDtoClassTypeEnum._('upload');
const DashboardWidgetDtoClassTypeEnum
    _$dashboardWidgetDtoClassTypeEnum_statistics =
    const DashboardWidgetDtoClassTypeEnum._('statistics');
const DashboardWidgetDtoClassTypeEnum
    _$dashboardWidgetDtoClassTypeEnum_recentDocuments =
    const DashboardWidgetDtoClassTypeEnum._('recentDocuments');
const DashboardWidgetDtoClassTypeEnum
    _$dashboardWidgetDtoClassTypeEnum_attention =
    const DashboardWidgetDtoClassTypeEnum._('attention');

DashboardWidgetDtoClassTypeEnum _$dashboardWidgetDtoClassTypeEnumValueOf(
    String name) {
  switch (name) {
    case 'savedView':
      return _$dashboardWidgetDtoClassTypeEnum_savedView;
    case 'upload':
      return _$dashboardWidgetDtoClassTypeEnum_upload;
    case 'statistics':
      return _$dashboardWidgetDtoClassTypeEnum_statistics;
    case 'recentDocuments':
      return _$dashboardWidgetDtoClassTypeEnum_recentDocuments;
    case 'attention':
      return _$dashboardWidgetDtoClassTypeEnum_attention;
    default:
      throw new ArgumentError(name);
  }
}

final BuiltSet<DashboardWidgetDtoClassTypeEnum>
    _$dashboardWidgetDtoClassTypeEnumValues = new BuiltSet<
        DashboardWidgetDtoClassTypeEnum>(const <DashboardWidgetDtoClassTypeEnum>[
  _$dashboardWidgetDtoClassTypeEnum_savedView,
  _$dashboardWidgetDtoClassTypeEnum_upload,
  _$dashboardWidgetDtoClassTypeEnum_statistics,
  _$dashboardWidgetDtoClassTypeEnum_recentDocuments,
  _$dashboardWidgetDtoClassTypeEnum_attention,
]);

Serializer<DashboardWidgetDtoClassTypeEnum>
    _$dashboardWidgetDtoClassTypeEnumSerializer =
    new _$DashboardWidgetDtoClassTypeEnumSerializer();

class _$DashboardWidgetDtoClassTypeEnumSerializer
    implements PrimitiveSerializer<DashboardWidgetDtoClassTypeEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'savedView': 'saved_view',
    'upload': 'upload',
    'statistics': 'statistics',
    'recentDocuments': 'recent_documents',
    'attention': 'attention',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'saved_view': 'savedView',
    'upload': 'upload',
    'statistics': 'statistics',
    'recent_documents': 'recentDocuments',
    'attention': 'attention',
  };

  @override
  final Iterable<Type> types = const <Type>[DashboardWidgetDtoClassTypeEnum];
  @override
  final String wireName = 'DashboardWidgetDtoClassTypeEnum';

  @override
  Object serialize(
          Serializers serializers, DashboardWidgetDtoClassTypeEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  DashboardWidgetDtoClassTypeEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      DashboardWidgetDtoClassTypeEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$DashboardWidgetDtoClass extends DashboardWidgetDtoClass {
  @override
  final String id;
  @override
  final DashboardWidgetDtoClassTypeEnum type;
  @override
  final num position;
  @override
  final num widthCols;
  @override
  final num heightRows;
  @override
  final String? savedViewId;
  @override
  final num? itemLimit;

  factory _$DashboardWidgetDtoClass(
          [void Function(DashboardWidgetDtoClassBuilder)? updates]) =>
      (new DashboardWidgetDtoClassBuilder()..update(updates))._build();

  _$DashboardWidgetDtoClass._(
      {required this.id,
      required this.type,
      required this.position,
      required this.widthCols,
      required this.heightRows,
      this.savedViewId,
      this.itemLimit})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(id, r'DashboardWidgetDtoClass', 'id');
    BuiltValueNullFieldError.checkNotNull(
        type, r'DashboardWidgetDtoClass', 'type');
    BuiltValueNullFieldError.checkNotNull(
        position, r'DashboardWidgetDtoClass', 'position');
    BuiltValueNullFieldError.checkNotNull(
        widthCols, r'DashboardWidgetDtoClass', 'widthCols');
    BuiltValueNullFieldError.checkNotNull(
        heightRows, r'DashboardWidgetDtoClass', 'heightRows');
  }

  @override
  DashboardWidgetDtoClass rebuild(
          void Function(DashboardWidgetDtoClassBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DashboardWidgetDtoClassBuilder toBuilder() =>
      new DashboardWidgetDtoClassBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DashboardWidgetDtoClass &&
        id == other.id &&
        type == other.type &&
        position == other.position &&
        widthCols == other.widthCols &&
        heightRows == other.heightRows &&
        savedViewId == other.savedViewId &&
        itemLimit == other.itemLimit;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, type.hashCode);
    _$hash = $jc(_$hash, position.hashCode);
    _$hash = $jc(_$hash, widthCols.hashCode);
    _$hash = $jc(_$hash, heightRows.hashCode);
    _$hash = $jc(_$hash, savedViewId.hashCode);
    _$hash = $jc(_$hash, itemLimit.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'DashboardWidgetDtoClass')
          ..add('id', id)
          ..add('type', type)
          ..add('position', position)
          ..add('widthCols', widthCols)
          ..add('heightRows', heightRows)
          ..add('savedViewId', savedViewId)
          ..add('itemLimit', itemLimit))
        .toString();
  }
}

class DashboardWidgetDtoClassBuilder
    implements
        Builder<DashboardWidgetDtoClass, DashboardWidgetDtoClassBuilder> {
  _$DashboardWidgetDtoClass? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  DashboardWidgetDtoClassTypeEnum? _type;
  DashboardWidgetDtoClassTypeEnum? get type => _$this._type;
  set type(DashboardWidgetDtoClassTypeEnum? type) => _$this._type = type;

  num? _position;
  num? get position => _$this._position;
  set position(num? position) => _$this._position = position;

  num? _widthCols;
  num? get widthCols => _$this._widthCols;
  set widthCols(num? widthCols) => _$this._widthCols = widthCols;

  num? _heightRows;
  num? get heightRows => _$this._heightRows;
  set heightRows(num? heightRows) => _$this._heightRows = heightRows;

  String? _savedViewId;
  String? get savedViewId => _$this._savedViewId;
  set savedViewId(String? savedViewId) => _$this._savedViewId = savedViewId;

  num? _itemLimit;
  num? get itemLimit => _$this._itemLimit;
  set itemLimit(num? itemLimit) => _$this._itemLimit = itemLimit;

  DashboardWidgetDtoClassBuilder() {
    DashboardWidgetDtoClass._defaults(this);
  }

  DashboardWidgetDtoClassBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _type = $v.type;
      _position = $v.position;
      _widthCols = $v.widthCols;
      _heightRows = $v.heightRows;
      _savedViewId = $v.savedViewId;
      _itemLimit = $v.itemLimit;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DashboardWidgetDtoClass other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$DashboardWidgetDtoClass;
  }

  @override
  void update(void Function(DashboardWidgetDtoClassBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DashboardWidgetDtoClass build() => _build();

  _$DashboardWidgetDtoClass _build() {
    final _$result = _$v ??
        new _$DashboardWidgetDtoClass._(
            id: BuiltValueNullFieldError.checkNotNull(
                id, r'DashboardWidgetDtoClass', 'id'),
            type: BuiltValueNullFieldError.checkNotNull(
                type, r'DashboardWidgetDtoClass', 'type'),
            position: BuiltValueNullFieldError.checkNotNull(
                position, r'DashboardWidgetDtoClass', 'position'),
            widthCols: BuiltValueNullFieldError.checkNotNull(
                widthCols, r'DashboardWidgetDtoClass', 'widthCols'),
            heightRows: BuiltValueNullFieldError.checkNotNull(
                heightRows, r'DashboardWidgetDtoClass', 'heightRows'),
            savedViewId: savedViewId,
            itemLimit: itemLimit);
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
