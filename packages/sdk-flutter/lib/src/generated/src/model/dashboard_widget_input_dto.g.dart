// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'dashboard_widget_input_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const DashboardWidgetInputDtoTypeEnum
    _$dashboardWidgetInputDtoTypeEnum_savedView =
    const DashboardWidgetInputDtoTypeEnum._('savedView');
const DashboardWidgetInputDtoTypeEnum _$dashboardWidgetInputDtoTypeEnum_upload =
    const DashboardWidgetInputDtoTypeEnum._('upload');
const DashboardWidgetInputDtoTypeEnum
    _$dashboardWidgetInputDtoTypeEnum_statistics =
    const DashboardWidgetInputDtoTypeEnum._('statistics');
const DashboardWidgetInputDtoTypeEnum
    _$dashboardWidgetInputDtoTypeEnum_recentDocuments =
    const DashboardWidgetInputDtoTypeEnum._('recentDocuments');
const DashboardWidgetInputDtoTypeEnum
    _$dashboardWidgetInputDtoTypeEnum_attention =
    const DashboardWidgetInputDtoTypeEnum._('attention');

DashboardWidgetInputDtoTypeEnum _$dashboardWidgetInputDtoTypeEnumValueOf(
    String name) {
  switch (name) {
    case 'savedView':
      return _$dashboardWidgetInputDtoTypeEnum_savedView;
    case 'upload':
      return _$dashboardWidgetInputDtoTypeEnum_upload;
    case 'statistics':
      return _$dashboardWidgetInputDtoTypeEnum_statistics;
    case 'recentDocuments':
      return _$dashboardWidgetInputDtoTypeEnum_recentDocuments;
    case 'attention':
      return _$dashboardWidgetInputDtoTypeEnum_attention;
    default:
      throw new ArgumentError(name);
  }
}

final BuiltSet<DashboardWidgetInputDtoTypeEnum>
    _$dashboardWidgetInputDtoTypeEnumValues = new BuiltSet<
        DashboardWidgetInputDtoTypeEnum>(const <DashboardWidgetInputDtoTypeEnum>[
  _$dashboardWidgetInputDtoTypeEnum_savedView,
  _$dashboardWidgetInputDtoTypeEnum_upload,
  _$dashboardWidgetInputDtoTypeEnum_statistics,
  _$dashboardWidgetInputDtoTypeEnum_recentDocuments,
  _$dashboardWidgetInputDtoTypeEnum_attention,
]);

Serializer<DashboardWidgetInputDtoTypeEnum>
    _$dashboardWidgetInputDtoTypeEnumSerializer =
    new _$DashboardWidgetInputDtoTypeEnumSerializer();

class _$DashboardWidgetInputDtoTypeEnumSerializer
    implements PrimitiveSerializer<DashboardWidgetInputDtoTypeEnum> {
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
  final Iterable<Type> types = const <Type>[DashboardWidgetInputDtoTypeEnum];
  @override
  final String wireName = 'DashboardWidgetInputDtoTypeEnum';

  @override
  Object serialize(
          Serializers serializers, DashboardWidgetInputDtoTypeEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  DashboardWidgetInputDtoTypeEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      DashboardWidgetInputDtoTypeEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$DashboardWidgetInputDto extends DashboardWidgetInputDto {
  @override
  final String? id;
  @override
  final DashboardWidgetInputDtoTypeEnum type;
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

  factory _$DashboardWidgetInputDto(
          [void Function(DashboardWidgetInputDtoBuilder)? updates]) =>
      (new DashboardWidgetInputDtoBuilder()..update(updates))._build();

  _$DashboardWidgetInputDto._(
      {this.id,
      required this.type,
      required this.position,
      required this.widthCols,
      required this.heightRows,
      this.savedViewId,
      this.itemLimit})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        type, r'DashboardWidgetInputDto', 'type');
    BuiltValueNullFieldError.checkNotNull(
        position, r'DashboardWidgetInputDto', 'position');
    BuiltValueNullFieldError.checkNotNull(
        widthCols, r'DashboardWidgetInputDto', 'widthCols');
    BuiltValueNullFieldError.checkNotNull(
        heightRows, r'DashboardWidgetInputDto', 'heightRows');
  }

  @override
  DashboardWidgetInputDto rebuild(
          void Function(DashboardWidgetInputDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DashboardWidgetInputDtoBuilder toBuilder() =>
      new DashboardWidgetInputDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DashboardWidgetInputDto &&
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
    return (newBuiltValueToStringHelper(r'DashboardWidgetInputDto')
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

class DashboardWidgetInputDtoBuilder
    implements
        Builder<DashboardWidgetInputDto, DashboardWidgetInputDtoBuilder> {
  _$DashboardWidgetInputDto? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  DashboardWidgetInputDtoTypeEnum? _type;
  DashboardWidgetInputDtoTypeEnum? get type => _$this._type;
  set type(DashboardWidgetInputDtoTypeEnum? type) => _$this._type = type;

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

  DashboardWidgetInputDtoBuilder() {
    DashboardWidgetInputDto._defaults(this);
  }

  DashboardWidgetInputDtoBuilder get _$this {
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
  void replace(DashboardWidgetInputDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$DashboardWidgetInputDto;
  }

  @override
  void update(void Function(DashboardWidgetInputDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DashboardWidgetInputDto build() => _build();

  _$DashboardWidgetInputDto _build() {
    final _$result = _$v ??
        new _$DashboardWidgetInputDto._(
            id: id,
            type: BuiltValueNullFieldError.checkNotNull(
                type, r'DashboardWidgetInputDto', 'type'),
            position: BuiltValueNullFieldError.checkNotNull(
                position, r'DashboardWidgetInputDto', 'position'),
            widthCols: BuiltValueNullFieldError.checkNotNull(
                widthCols, r'DashboardWidgetInputDto', 'widthCols'),
            heightRows: BuiltValueNullFieldError.checkNotNull(
                heightRows, r'DashboardWidgetInputDto', 'heightRows'),
            savedViewId: savedViewId,
            itemLimit: itemLimit);
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
