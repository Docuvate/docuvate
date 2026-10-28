// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'document_pipeline_module_descriptor_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$DocumentPipelineModuleDescriptorDto
    extends DocumentPipelineModuleDescriptorDto {
  @override
  final String id;
  @override
  final String label;
  @override
  final String description;
  @override
  final bool defaultEnabled;
  @override
  final num defaultOrder;

  factory _$DocumentPipelineModuleDescriptorDto(
          [void Function(DocumentPipelineModuleDescriptorDtoBuilder)?
              updates]) =>
      (new DocumentPipelineModuleDescriptorDtoBuilder()..update(updates))
          ._build();

  _$DocumentPipelineModuleDescriptorDto._(
      {required this.id,
      required this.label,
      required this.description,
      required this.defaultEnabled,
      required this.defaultOrder})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        id, r'DocumentPipelineModuleDescriptorDto', 'id');
    BuiltValueNullFieldError.checkNotNull(
        label, r'DocumentPipelineModuleDescriptorDto', 'label');
    BuiltValueNullFieldError.checkNotNull(
        description, r'DocumentPipelineModuleDescriptorDto', 'description');
    BuiltValueNullFieldError.checkNotNull(defaultEnabled,
        r'DocumentPipelineModuleDescriptorDto', 'defaultEnabled');
    BuiltValueNullFieldError.checkNotNull(
        defaultOrder, r'DocumentPipelineModuleDescriptorDto', 'defaultOrder');
  }

  @override
  DocumentPipelineModuleDescriptorDto rebuild(
          void Function(DocumentPipelineModuleDescriptorDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DocumentPipelineModuleDescriptorDtoBuilder toBuilder() =>
      new DocumentPipelineModuleDescriptorDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DocumentPipelineModuleDescriptorDto &&
        id == other.id &&
        label == other.label &&
        description == other.description &&
        defaultEnabled == other.defaultEnabled &&
        defaultOrder == other.defaultOrder;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, label.hashCode);
    _$hash = $jc(_$hash, description.hashCode);
    _$hash = $jc(_$hash, defaultEnabled.hashCode);
    _$hash = $jc(_$hash, defaultOrder.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'DocumentPipelineModuleDescriptorDto')
          ..add('id', id)
          ..add('label', label)
          ..add('description', description)
          ..add('defaultEnabled', defaultEnabled)
          ..add('defaultOrder', defaultOrder))
        .toString();
  }
}

class DocumentPipelineModuleDescriptorDtoBuilder
    implements
        Builder<DocumentPipelineModuleDescriptorDto,
            DocumentPipelineModuleDescriptorDtoBuilder> {
  _$DocumentPipelineModuleDescriptorDto? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _label;
  String? get label => _$this._label;
  set label(String? label) => _$this._label = label;

  String? _description;
  String? get description => _$this._description;
  set description(String? description) => _$this._description = description;

  bool? _defaultEnabled;
  bool? get defaultEnabled => _$this._defaultEnabled;
  set defaultEnabled(bool? defaultEnabled) =>
      _$this._defaultEnabled = defaultEnabled;

  num? _defaultOrder;
  num? get defaultOrder => _$this._defaultOrder;
  set defaultOrder(num? defaultOrder) => _$this._defaultOrder = defaultOrder;

  DocumentPipelineModuleDescriptorDtoBuilder() {
    DocumentPipelineModuleDescriptorDto._defaults(this);
  }

  DocumentPipelineModuleDescriptorDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _label = $v.label;
      _description = $v.description;
      _defaultEnabled = $v.defaultEnabled;
      _defaultOrder = $v.defaultOrder;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DocumentPipelineModuleDescriptorDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$DocumentPipelineModuleDescriptorDto;
  }

  @override
  void update(
      void Function(DocumentPipelineModuleDescriptorDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DocumentPipelineModuleDescriptorDto build() => _build();

  _$DocumentPipelineModuleDescriptorDto _build() {
    final _$result = _$v ??
        new _$DocumentPipelineModuleDescriptorDto._(
            id: BuiltValueNullFieldError.checkNotNull(
                id, r'DocumentPipelineModuleDescriptorDto', 'id'),
            label: BuiltValueNullFieldError.checkNotNull(
                label, r'DocumentPipelineModuleDescriptorDto', 'label'),
            description: BuiltValueNullFieldError.checkNotNull(description,
                r'DocumentPipelineModuleDescriptorDto', 'description'),
            defaultEnabled: BuiltValueNullFieldError.checkNotNull(
                defaultEnabled,
                r'DocumentPipelineModuleDescriptorDto',
                'defaultEnabled'),
            defaultOrder: BuiltValueNullFieldError.checkNotNull(defaultOrder,
                r'DocumentPipelineModuleDescriptorDto', 'defaultOrder'));
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
